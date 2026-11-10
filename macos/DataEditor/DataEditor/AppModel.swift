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

        var errorDescription: String? {
            switch self {
            case .updating: "The data is being updated. Submit again once the update finishes."
            }
        }
    }

    var phase: Phase = .starting
    var buildings: [BuildingSummary] = []
    var calendar: BreakCalendar?
    var selection: String? { didSet { if let selection, selection != oldValue { Task { await select(selection) } } } }
    var document: HoursDocument?
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
    /// Set while `submit` runs, which reads `data/` that an update would replace underneath it.
    private(set) var submitting = false
    /// Set while `launch()` runs, so a second call does not start a second helper and ccc.
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

    /// Downloads the workspace if need be and starts the helper and ccc. Does
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
            buildProblems = try await helper.build().problems
            if testHelper == nil {
                let port = try await helper.serve(port: Self.port)
                let origin = DataEditorKit.pagesOrigin(localHostName: Self.localHostName(), port: port)
                pagesOrigin = origin
                let ccc = CccRunner(configuration: .bundled(node: runtime.node, cccRoot: runtime.cccRoot, pagesOrigin: origin, state: support.appending(path: "ccc")))
                if shuttingDown { return }
                self.ccc = ccc
                Task { for await status in await ccc.statuses() { self.cccStatus = status; self.cccLog = await ccc.log } }
                await ccc.start()
            }
            buildings = try await helper.buildings()
            calendar = try await helper.calendar()
            changedFiles = try workspace.changedFiles()
            conflicts = workspace.conflicts
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

    func restartCcc() async { await ccc?.start() }

    /// Stops ccc's whole process group and the helper, so quitting leaves nothing holding a port.
    func shutdown() async {
        shuttingDown = true
        await stopProcesses()
    }

    private func stopProcesses() async {
        await ccc?.stop()
        ccc = nil
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
            problems = loaded.problems
        } catch {
            guard selection == file else { return }
            document = nil
            problems = [Problem(file: file, message: error.localizedDescription, path: nil)]
        }
    }

    /// Edits the selected file. Does nothing during an update, or to a file
    /// with an open conflict, whose set-aside copy the edit would replace.
    func apply(_ ops: [EditOp]) async {
        guard !updating, let helper, let file = selection, !isConflicted(file), !ops.isEmpty else { return }
        do {
            let edited = try await helper.edit(file, ops)
            document = HoursDocument(value: edited.value)
            problems = edited.problems
            changedFiles = try workspace.changedFiles()
            if edited.problems.isEmpty {
                await builds.schedule { await self.rebuild() }
            }
        } catch {
            problems = [Problem(file: file, message: error.localizedDescription, path: nil)]
        }
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
    /// would send that file as deleted.
    func submit(summary: String) async throws {
        if updating { throw Refusal.updating }
        guard let base = baseCommit else { return }
        submitting = true
        defer { submitting = false }
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
