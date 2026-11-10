import AppKit
import DataEditorKit
import Foundation
import Observation
import SystemConfiguration

/// Everything the windows show, and the one place that talks to the helper, ccc and GitHub.
@MainActor @Observable
final class AppModel {
    enum Phase: Equatable {
        case starting, downloading, ready, needsAppUpdate
        case failed(String)

        /// Whether `launch()` may start: before the first launch, and again
        /// after a failure. Once started it runs to `ready` or a dead end.
        var allowsLaunch: Bool {
            switch self {
            case .starting, .failed: true
            case .downloading, .ready, .needsAppUpdate: false
            }
        }
    }

    enum Refusal: LocalizedError {
        case updating
        case buildProblems

        var errorDescription: String? {
            switch self {
            case .updating: "The data is being updated. Submit again once the update finishes."
            case .buildProblems: "The data has problems that stop it building. Fix the ones listed, then submit again."
            }
        }
    }

    var phase: Phase = .starting
    var buildings: [BuildingSummary] = []
    var calendar: BreakCalendar?
    var selection: String? { didSet { if let selection, selection != oldValue { Task { await select(selection) } } } }
    var document: HoursDocument?
    /// The file `document` was read from. `selection` changes first, while the
    /// new file loads, so an edit drawn from the document on screen names this.
    private(set) var documentFile: String?
    var problems: [Problem] = []
    var buildProblems: [Problem] = []
    var changedFiles: [String] = []
    var cccStatus: CccRunner.Status = .stopped
    var cccLog: [String] = []
    var pagesOrigin: String?
    var submission: Submission? { didSet { saveSubmission() } }
    var submissionState: SubmissionState?
    /// master's newest commit, when it is not the one being edited
    var newerCommit: String?
    var conflicts: [String] = []
    /// Set while `updateWorkspace` runs. The update saves the edits before it
    /// downloads, so anything written into `data/` meanwhile would be lost.
    private(set) var updating = false
    /// Why the last update failed. The workspace is left as it was, so editing goes on.
    private(set) var updateError: String?
    /// Set while an edit waits for the helper's reply. Edits made meanwhile
    /// are dropped: they were built from the document before the reply, so a
    /// second click on Remove would name a row that has since moved.
    private(set) var editing = false
    /// Set while `submit` runs, which reads `data/` that an update would replace underneath it.
    private(set) var submitting = false
    /// Set while `launch()` runs, so a second call does not start a second helper.
    private var launching = false
    /// Set once quitting has begun, so a launch still under way starts nothing more.
    private var shuttingDown = false

    let tokens = KeychainTokenStore()
    private let runtime: Runtime
    private let support: URL
    /// UI tests run the repo's own helper on the test runner's Node, and no ccc
    private let testHelper: (node: URL, scripts: URL)?
    private let workspace: Workspace
    private var helper: HelperClient?
    private var ccc: CccRunner?
    /// Copies ccc's statuses into `cccStatus`. Its stream never ends, so stopping the preview cancels it.
    private var cccWatch: Task<Void, Never>?
    /// Counts starts and stops of the preview. A `startPreview` whose number
    /// is no longer the newest gives up after each wait, so a Stop holds and
    /// a Stop then Start makes one ccc, not two.
    private var previewGeneration = 0
    private let builds = Debouncer(delay: .milliseconds(500))

    static let port = 8790

    init(runtime: Runtime = .bundled) {
        self.runtime = runtime
        let defaults = UserDefaults.standard
        support = defaults.string(forKey: "UITestWorkspace").map { URL(filePath: $0) }
            ?? FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0].appending(path: "DataEditor")
        if let node = defaults.string(forKey: "UITestNode"), let scripts = defaults.string(forKey: "UITestHelper") {
            testHelper = (URL(filePath: node), URL(filePath: scripts))
        } else {
            testHelper = nil
        }
        workspace = Workspace(root: support.appending(path: "workspace"))
        submission = (try? Data(contentsOf: support.appending(path: "submission.json"))).flatMap { try? JSONDecoder().decode(Submission.self, from: $0) }
    }

    var githubClientID: String { Bundle.main.object(forInfoDictionaryKey: "DataEditorGitHubClientID") as? String ?? "" }
    var appVersion: String { Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "dev" }
    var baseCommit: String? { workspace.snapshot?.commit }

    /// Whether `file` waits for the contributor to choose between their copy and master's.
    /// Editing it would replace the copy they set aside, so it is not editable until they choose.
    func isConflicted(_ file: String) -> Bool { conflicts.contains(file) }

    /// Downloads the workspace if need be and starts the helper. The first
    /// build waits for the preview or a submission, so editing opens quickly. Does
    /// nothing while a launch runs or once one has succeeded; after a failure
    /// it starts again, first stopping whatever the failed attempt started.
    func launch() async {
        guard !launching, !shuttingDown, phase.allowsLaunch else { return }
        launching = true
        defer { launching = false }
        await stopProcesses()
        do {
            if workspace.snapshot == nil {
                phase = .downloading
                try await workspace.download(commit: try await workspace.latestCommit())
            }
            let node: URL
            let script: URL
            if let testHelper {
                (node, script) = (testHelper.node, testHelper.scripts.appending(path: "data-editor-helper.mjs"))
            } else {
                guard let snapshot = workspace.snapshot, snapshot.isCompatible(with: try runtime.stamp()) else {
                    phase = .needsAppUpdate
                    return
                }
                try runtime.installHelper(into: workspace.root)
                (node, script) = (runtime.node, workspace.root.appending(path: "scripts/data-editor-helper.mjs"))
            }
            if shuttingDown { return }
            let helper = try HelperClient(executable: node, arguments: [
                script.path, "--data", workspace.dataDirectory.path, "--out", workspace.outDirectory.path,
            ])
            await helper.start()
            self.helper = helper
            // the list appears with the phase that enables it, so no row shows unclickable
            let listed = try await helper.buildings()
            calendar = try await helper.calendar()
            changedFiles = try workspace.changedFiles()
            conflicts = workspace.conflicts
            buildings = listed
            phase = .ready
            if let selection { await select(selection) }
            if testHelper == nil {
                await refreshSubmission()
                let latest = try? await workspace.latestCommit()
                newerCommit = latest == workspace.snapshot?.commit ? nil : latest
            }
        } catch {
            phase = .failed(error.localizedDescription)
        }
    }

    /// Starts the phone preview: builds, serves the newest good build and runs
    /// ccc on it. A build with problems lists them and the preview starts
    /// anyway, serving the last good build if there is one.
    /// After a crash or a refused port it starts the same ccc again. Does
    /// nothing while it starts or runs, during an update or quitting, or
    /// under UI tests, which have no bundled ccc to run.
    func startPreview() async {
        guard testHelper == nil, !shuttingDown, !updating, let helper else { return }
        switch cccStatus {
        case .starting, .running: return
        case .stopped, .portInUse, .crashed: break
        }
        // the build and the server come before ccc says anything, so say it is
        // starting now, which also turns away a second call meanwhile
        cccStatus = .starting
        previewGeneration += 1
        let generation = previewGeneration
        await rebuild()
        // a Stop, or a Stop and a newer start, came meanwhile
        guard generation == previewGeneration else { return }
        if let ccc {
            await ccc.start()
            return
        }
        do {
            let port = try await helper.serve(port: Self.port)
            let origin = DataEditorKit.pagesOrigin(localHostName: Self.localHostName(), port: port)
            pagesOrigin = origin
            if shuttingDown || generation != previewGeneration { return }
            let ccc = CccRunner(configuration: .bundled(node: runtime.node, cccRoot: runtime.cccRoot, pagesOrigin: origin, state: support.appending(path: "ccc")))
            self.ccc = ccc
            cccWatch = Task { for await status in await ccc.statuses() { self.cccStatus = status; self.cccLog = await ccc.log } }
            await ccc.start()
        } catch {
            guard generation == previewGeneration else { return }
            cccLog = [error.localizedDescription]
            cccStatus = .crashed(1)
        }
    }

    /// Stops ccc and lets it go. The helper keeps serving the build, which costs nothing and the next start reuses.
    func stopPreview() async {
        previewGeneration += 1
        cccWatch?.cancel()
        cccWatch = nil
        await ccc?.stop()
        ccc = nil
        cccStatus = .stopped
    }

    /// Stops ccc's whole process group and the helper, so quitting leaves nothing holding a port.
    func shutdown() async {
        shuttingDown = true
        await stopProcesses()
    }

    private func stopProcesses() async {
        await stopPreview()
        await helper?.stop()
        helper = nil
    }

    func select(_ file: String) async {
        guard let helper else { return }
        do {
            let loaded = try await helper.load(file)
            // a later selection's load owns the document now
            guard selection == file else { return }
            document = HoursDocument(value: loaded.value)
            documentFile = file
            problems = loaded.problems
        } catch {
            guard selection == file else { return }
            document = nil
            documentFile = nil
            problems = [Problem(file: file, message: error.localizedDescription, path: nil)]
        }
    }

    /// Edits the file on screen. See `apply(_:to:)`.
    @discardableResult
    func apply(_ ops: [EditOp]) async -> Bool {
        guard let file = documentFile else { return false }
        return await apply(ops, to: file)
    }

    /// Edits `file`, which a text field still holding a draft names after the
    /// selection has moved on. The document follows only an edit to the
    /// selected file. Does nothing during an update, to a file with
    /// an open conflict, whose set-aside copy the edit would replace, or while
    /// another edit waits for its reply. Returns whether the helper took the edit.
    @discardableResult
    func apply(_ ops: [EditOp], to file: String) async -> Bool {
        guard !updating, !editing, let helper, !isConflicted(file), !ops.isEmpty else { return false }
        editing = true
        defer { editing = false }
        let edited: Loaded
        do {
            edited = try await helper.edit(file, ops)
        } catch {
            if file == selection { problems = [Problem(file: file, message: error.localizedDescription, path: nil)] }
            return false
        }
        changedFiles = (try? workspace.changedFiles()) ?? changedFiles
        if file == selection {
            document = HoursDocument(value: edited.value)
            documentFile = file
            problems = edited.problems
        }
        if edited.problems.isEmpty {
            await builds.schedule { await self.rebuild() }
        }
        return true
    }

    /// What became of a text field's draft.
    enum DraftOutcome: Equatable {
        case saved
        /// refused for good, by a conflict or a helper failure; the field keeps the text
        case notSaved
        /// The file no longer held the text the draft began from: an update
        /// changed it, or the service moved. The field takes `current`, and the
        /// typed text stays in sight in the problems.
        case letGo(current: String)
    }

    /// Saves a text field's draft, `op` setting the text at its path in
    /// `file`. Waits for an edit or an update in flight, then writes only if
    /// the file still holds `expected` there: a draft whose service has moved
    /// or gone since it began is never written into another.
    func applyDraft(_ op: EditOp, to file: String, replacing expected: String) async -> DraftOutcome {
        while true {
            // a short wait: an edit takes one helper round trip, an update a download
            while editing || updating {
                if shuttingDown { return .notSaved }
                try? await Task.sleep(for: .milliseconds(50))
            }
            guard let helper, let current = try? await helper.load(file).value else { return .notSaved }
            let held = current[path: op.path]?.string ?? ""
            guard held == expected else {
                if file == selection {
                    await select(file)
                    let typed = op.value?.string ?? ""
                    problems.append(Problem(file: file, message: "“\(typed)” was not saved: the file changed there while you typed. Copy it from here if you still want it.", path: op.path))
                }
                return .letGo(current: held)
            }
            if await apply([op], to: file) { return .saved }
            // refused for good: a conflict, or the helper failed
            if !editing && !updating { return .notSaved }
        }
    }

    /// Text fields holding text not yet in their file. Removing a service or
    /// an exception waits for them, since it moves the place a draft is saved to.
    private(set) var unsavedDrafts: Set<UUID> = []

    func noteDraft(_ id: UUID, unsaved: Bool) {
        if unsaved { unsavedDrafts.insert(id) } else { unsavedDrafts.remove(id) }
    }

    /// Builds the data into `out/`. Skipped during an update, which reloads
    /// everything and builds once it is done.
    private func rebuild() async {
        guard !updating, let helper else { return }
        buildProblems = (try? await helper.build().problems) ?? [Problem(file: nil, message: "The build did not run", path: nil)]
        cccLog = await ccc?.log ?? []
    }

    func revert(_ file: String) async {
        guard !updating else { return }
        try? workspace.revert(file)
        await afterFilesChanged()
    }

    func diff(for file: String) -> [DiffLine] {
        let text = { (data: Data?) in data.map { String(decoding: $0, as: UTF8.self) } ?? "" }
        return lineDiff(old: text(try? workspace.baseContents(of: file)), new: text(try? workspace.contents(of: file)))
    }

    /// Opens a pull request, or adds a commit to the open one. Refuses during
    /// an update, which may have removed a file it has not yet put back, and
    /// would send that file as deleted. Builds first and refuses data that
    /// does not build, since nothing else may have built it this session.
    func submit(summary: String) async throws {
        if updating { throw Refusal.updating }
        guard let base = baseCommit, let helper else { return }
        submitting = true
        defer { submitting = false }
        buildProblems = try await helper.build().problems
        if !buildProblems.isEmpty { throw Refusal.buildProblems }
        let submitter = GitHubSubmitter(tokens: tokens)
        let changes = changedFiles.map { Change(path: "data/\($0)", contents: try? workspace.contents(of: $0)) }
        if let submission, submissionState == .open || submissionState == .changesRequested {
            self.submission = try await submitter.update(submission, changes: changes, summary: summary)
        } else {
            submission = try await submitter.submit(changes: changes, base: base, summary: summary, appVersion: appVersion)
        }
        await refreshSubmission()
    }

    func refreshSubmission() async {
        guard let submission else { submissionState = nil; return }
        submissionState = try? await GitHubSubmitter(tokens: tokens).state(of: submission)
    }

    /// Moves to master's newest commit, keeping the contributor's edits. A
    /// merged pull request's edits are on master by then, so it is forgotten.
    /// Does nothing while a submission is being sent from `data/`. A failed
    /// update leaves the workspace as it was, so it reports in `updateError`
    /// and editing goes on.
    func updateWorkspace() async {
        guard !updating, !submitting else { return }
        updating = true
        updateError = nil
        do {
            conflicts = try await workspace.update(to: try await workspace.latestCommit())
        } catch {
            updating = false
            updateError = error.localizedDescription
            conflicts = workspace.conflicts
            await afterFilesChanged()
            return
        }
        updating = false
        newerCommit = nil
        if submissionState == .merged || submissionState == .closed {
            submission = nil
            submissionState = nil
        }
        do {
            if testHelper == nil, let snapshot = workspace.snapshot, !snapshot.isCompatible(with: try runtime.stamp()) {
                phase = .needsAppUpdate
                return
            }
        } catch {
            phase = .failed(error.localizedDescription)
            return
        }
        await afterFilesChanged()
    }

    func keepMine(_ file: String) async {
        guard !updating else { return }
        try? workspace.keepMine(file)
        conflicts = workspace.conflicts
        await afterFilesChanged()
    }

    func keepLatest(_ file: String) async {
        guard !updating else { return }
        try? workspace.keepLatest(file)
        conflicts = workspace.conflicts
        await afterFilesChanged()
    }

    /// The helper reads files afresh for each request, so only the lists, the open file and the build need refreshing.
    private func afterFilesChanged() async {
        changedFiles = (try? workspace.changedFiles()) ?? []
        buildings = (try? await helper?.buildings()) ?? buildings
        calendar = (try? await helper?.calendar()) ?? calendar
        if let selection { await select(selection) }
        await rebuild()
    }

    private func saveSubmission() {
        let file = support.appending(path: "submission.json")
        if let submission, let data = try? JSONEncoder().encode(submission) { try? data.write(to: file) }
        else { try? FileManager.default.removeItem(at: file) }
    }

    /// The Mac's Bonjour name (Sharing → Local hostname), without `.local`.
    static func localHostName() -> String {
        (SCDynamicStoreCopyLocalHostName(nil) as String?) ?? ProcessInfo.processInfo.hostName.replacingOccurrences(of: ".local", with: "")
    }
}
