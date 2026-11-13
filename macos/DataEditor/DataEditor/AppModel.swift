import AppKit
import DataEditorKit
import Foundation
import Observation
import os
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
        case submitting
        case updating
        case buildProblems
        case notReady
        case unsavedText
        case conflicts

        var errorDescription: String? {
            switch self {
            case .submitting: "Your changes are already being submitted."
            case .notReady: "The data is still loading."
            case .updating: "The data is still updating."
            case .buildProblems: "Fix the problems listed first."
            case .unsavedText: "Some text you typed isn't saved yet. Press Return in that field."
            case .conflicts: "Choose which copy to keep of each conflicting file first."
            }
        }
    }

    var phase: Phase = .starting
    var calendar: BreakCalendar?
    var selection: String? { didSet { if let selection, selection != oldValue { Task { await select(selection) } } } }
    var document: HoursDocument?
    /// The selected file's value, which a record's form reads its record from.
    private(set) var value: JSONValue?
    /// The data sets the editor offers, from the workspace's `_datasets.yaml`.
    private(set) var catalog: DataSetCatalog?
    /// Each data set's records, by set, once the record column has listed it.
    private(set) var records: [String: [RecordSummary]] = [:]
    /// The data set the record column lists: Hours until another is chosen.
    private(set) var chosenSet = "building-hours"
    /// Each set's record schema, once asked for; a schema changes only with the app's data.
    private var schemas: [String: JSONValue] = [:]
    /// The file `document` was read from. `selection` changes first, while the
    /// new file loads, so an edit drawn from the document on screen names this.
    private(set) var documentFile: String?
    var problems: [Problem] = []
    var buildProblems: [Problem] = []
    var changedFiles: [String] = []
    var cccStatus: CccRunner.Status = .stopped
    var cccLog: [String] = []
    var pagesOrigin: String?
    /// Every pull request submitted from this app, kept in `submissions.json`.
    private(set) var submissions = SubmissionHistory() { didSet { submissions.save(to: support.appending(path: "submissions.json")) } }
    /// The pull request a new submission adds a commit to, if there is one.
    var currentSubmission: SubmissionRecord? { submissions.current }
    /// The pull requests whose last check GitHub did not answer.
    private(set) var checkFailures = CheckFailures()
    /// Whether GitHub would not show the current pull request (see
    /// `CheckFailures.isUnreadable`). Every submission asks after it first, so only
    /// forgetting it lets the contributor submit again.
    var submissionUnreadable: Bool { currentSubmission.map { checkFailures.gone.contains($0.id) } ?? false }
    /// Set when the preview stopped because the helper could not serve the data on `port`.
    private(set) var servePortInUse = false
    /// Set while the first start downloads and installs Node and ccc-server.
    private(set) var previewInstalling = false
    /// Set when that download or install failed, which the preview's popover says.
    private(set) var previewInstallFailed = false
    /// master's newest commit, when it is not the one being edited
    var newerCommit: String?
    var conflicts: [String] = []
    /// Text fields' drafts that were let go because their file changed while
    /// they were typed, each quoting the typed text. They report and do not
    /// stop a submission, since the file holds nothing wrong.
    private(set) var draftNotices: [Problem] = []
    /// Set while `updateWorkspace` runs. The update saves the edits before it
    /// downloads, so anything written into `data/` meanwhile would be lost.
    private(set) var updating = false
    /// Why the last update failed. The workspace is left as it was, so editing goes on.
    private(set) var updateError: String?
    /// The edit waiting for the helper's reply. Edits made meanwhile are
    /// dropped: they were built from the document before the reply, so a
    /// second click on Remove would name a row that has since moved. The
    /// editor greys its controls only for an edit slow enough to notice.
    let edits = SlowWork(delay: .milliseconds(500))
    /// Whether an edit waits for the helper's reply.
    var editing: Bool { edits.isRunning }
    /// Set while `submit` runs, which reads `data/` that an update would replace underneath it.
    private(set) var submitting = false
    /// Set once `submit` has saved what was typed, while it builds and sends
    /// `data/`: an edit then would reach the pull request without the build seeing it.
    private(set) var sending = false
    /// Set while `launch()` runs, so a second call does not start a second helper.
    private var launching = false
    /// Set once quitting has begun, so a launch still under way starts nothing more.
    private var shuttingDown = false

    let tokens = KeychainTokenStore()
    private let runtime: Runtime
    private let support: URL
    /// UI tests write the data with the repo's own oxfmt, run on the test runner's Node, and run no ccc
    private let testOxfmt: URL?
    private let workspace: Workspace
    private var helper: HelperClient?
    private var buildServer: BuildServer?
    /// The newest good build, which the build server reads on each request.
    private let currentBuild = OSAllocatedUnfairLock<URL?>(initialState: nil)
    private var ccc: CccRunner?
    /// The first start's download and install of Node and ccc-server, which a Stop cancels.
    private var install: Task<Void, any Error>?
    /// Copies ccc's statuses into `cccStatus`. Its stream never ends, so stopping the preview cancels it.
    private var cccWatch: Task<Void, Never>?
    /// Counts starts and stops of the preview. A `startPreview` whose number
    /// is no longer the newest gives up after each wait, so a Stop holds and
    /// a Stop then Start makes one ccc, not two.
    private var previewGeneration = 0
    private let builds = Debouncer(delay: .milliseconds(500))

    static let port = 8790

    /// The app's folder in `applicationSupport`, named by its bundle
    /// identifier so no other app shares it.
    static func supportFolder(in applicationSupport: URL, bundleIdentifier: String?) -> URL {
        applicationSupport.appending(path: bundleIdentifier ?? "com.drewvolz.allaboutolaf-data-editor")
    }

    /// - Parameter support: the folder for the workspace and the history, where unit tests give their own
    init(runtime: Runtime = .bundled, support: URL? = nil) {
        self.runtime = runtime
        let defaults = UserDefaults.standard
        self.support = support ?? defaults.string(forKey: "UITestWorkspace").map { URL(filePath: $0) }
            ?? Self.supportFolder(in: FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0],
                                  bundleIdentifier: Bundle.main.bundleIdentifier)
        testOxfmt = defaults.string(forKey: "UITestOxfmt").map { URL(filePath: $0) }
        // Checking a branch whose helper no deploy has published: serve a folder
        // holding data-editor/ from `node scripts/build-data-editor-helper.mjs
        // --out <folder>/data-editor --commit <a pushed commit>`, and point
        // `defaults write <bundle id> DataEditorPages http://localhost:<port>/` at it.
        let root = self.support.appending(path: "workspace")
        workspace = defaults.string(forKey: "DataEditorPages").flatMap { URL(string: $0) }
            .map { Workspace(root: root, pages: $0) } ?? Workspace(root: root)
        // a file this build cannot read is copied aside before anything saves over it
        submissions = SubmissionHistory.load(from: self.support.appending(path: "submissions.json")).history
    }

    /// The GitHub OAuth app's client ID. UI tests set their own, so a test of
    /// a build without one holds once the build has one.
    var githubClientID: String {
        UserDefaults.standard.string(forKey: "UITestGitHubClientID")
            ?? Bundle.main.object(forInfoDictionaryKey: "DataEditorGitHubClientID") as? String ?? ""
    }
    /// Whether UI tests launched the app, which then reaches no server of its own accord.
    var runsUnderUITests: Bool { testOxfmt != nil }
    var appVersion: String { Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "dev" }
    var baseCommit: String? { workspace.snapshot?.commit }

    /// Whether `file` waits for the contributor to choose between their copy and master's.
    /// Editing it would replace the copy they set aside, so it is not editable until they choose.
    func isConflicted(_ file: String) -> Bool { conflicts.contains(file) }

    /// Downloads the workspace if need be and loads the helper it holds. The first
    /// build waits for the preview or a submission, so editing opens quickly. Does
    /// nothing while a launch runs or once one has succeeded; after a failure
    /// it starts again, first stopping whatever the failed attempt started.
    func launch() async {
        guard !launching, !shuttingDown, phase.allowsLaunch else { return }
        launching = true
        defer { launching = false }
        // a retry after a failure must not show that failure, and its Try Again, while it runs
        phase = .starting
        await stopProcesses()
        do {
            if workspace.snapshot == nil {
                phase = .downloading
                try await workspace.downloadLatest()
            }
            if shuttingDown { return }
            // edits an update failed to put back are put back before anything reads data/
            _ = try workspace.resumeReplay()
            // a helper that will not load, or that an older app downloaded, gives way to master's
            let helper = try await workspace.loadHelper(oxfmt: testOxfmt ?? runtime.oxfmt)
            self.helper = helper
            // the list appears with the phase that enables it, so no row shows unclickable
            calendar = try await helper.calendar()
            catalog = try await helper.datasets()
            records[chosenSet] = try await helper.records(set: chosenSet).records
            changedFiles = try workspace.changedFiles()
            conflicts = workspace.conflicts
            phase = .ready
            if let selection { await select(selection) }
            // the list is usable meanwhile, so the launch need not wait for GitHub
            Task { await refreshSubmissions() }
            await refreshNewerCommit()
        } catch is Workspace.NeedsNewerApp {
            phase = .needsAppUpdate
        } catch {
            phase = .failed(error.localizedDescription)
        }
    }

    /// Builds into `out/`, and serves the build from now on if it is good.
    private func build(with helper: HelperClient) async throws -> [Problem] {
        let result = try await helper.build(serving: currentBuild.withLock { $0 })
        if let dir = result.dir { currentBuild.withLock { $0 = URL(filePath: dir) } }
        return result.problems
    }

    /// Starts the phone preview: builds, serves the newest good build and runs
    /// ccc on it. A build with problems lists them and the preview starts
    /// anyway, serving the last good build if there is one. The first start
    /// downloads Node and ccc-server, as `PreviewInstaller` says.
    /// After a crash or a refused port it starts the same ccc again. Does
    /// nothing while it starts or runs, during an update or quitting, or
    /// under UI tests, which run no ccc.
    func startPreview() async {
        guard testOxfmt == nil, !shuttingDown, !updating, helper != nil else { return }
        switch cccStatus {
        case .starting, .running: return
        case .stopped, .portInUse, .crashed: break
        }
        // the build and the server come before ccc says anything, so say it is
        // starting now, which also turns away a second call meanwhile
        cccStatus = .starting
        servePortInUse = false
        previewInstallFailed = false
        previewGeneration += 1
        let generation = previewGeneration
        await rebuild()
        // a Stop, or a Stop and a newer start, came meanwhile
        guard generation == previewGeneration else { return }
        let installer: PreviewInstaller
        do {
            // not support/ccc, which holds ccc's own state
            installer = try PreviewInstaller(root: support.appending(path: "preview"), node: runtime.nodeRelease(), cccCommit: runtime.cccCommit())
            if !installer.isReady {
                previewInstalling = true
                let install = Task { try await installer.install() }
                self.install = install
                try await install.value
                // a Stop, or a Stop and a newer start, came meanwhile and owns these now
                guard generation == previewGeneration else { return }
                previewInstalling = false
                self.install = nil
            }
        } catch {
            // a Stop cancelled the install, and says what the preview is now
            guard generation == previewGeneration else { return }
            previewInstalling = false
            install = nil
            cccLog = error.localizedDescription.split(separator: "\n").map(String.init)
            previewInstallFailed = true
            cccStatus = .crashed(1)
            return
        }
        guard generation == previewGeneration else { return }
        if let ccc {
            await ccc.start()
            return
        }
        do {
            if buildServer == nil {
                let server = BuildServer(port: UInt16(Self.port), root: { [currentBuild] in currentBuild.withLock { $0 } })
                try await server.start()
                buildServer = server
            }
            let port = Self.port
            let origin = DataEditorKit.pagesOrigin(localHostName: Self.localHostName(), port: port)
            pagesOrigin = origin
            if shuttingDown || generation != previewGeneration { return }
            let ccc = CccRunner(configuration: .bundled(node: installer.nodeExecutable, cccRoot: installer.cccRoot, pagesOrigin: origin, state: support.appending(path: "ccc")))
            self.ccc = ccc
            cccWatch = Task { for await status in await ccc.statuses() { self.cccStatus = status; self.cccLog = await ccc.log } }
            await ccc.start()
        } catch {
            guard generation == previewGeneration else { return }
            cccLog = [error.localizedDescription]
            servePortInUse = error as? BuildServer.Failure == .portInUse(UInt16(Self.port))
            cccStatus = .crashed(1)
        }
    }

    /// Stops ccc and lets it go. The build server keeps serving the build, which costs nothing and the next start reuses.
    func stopPreview() async {
        install?.cancel()
        install = nil
        previewInstalling = false
        previewInstallFailed = false
        previewGeneration += 1
        cccWatch?.cancel()
        cccWatch = nil
        await ccc?.stop()
        ccc = nil
        cccStatus = .stopped
        servePortInUse = false
    }

    /// Readies the app to quit: lets an update or a submission in flight
    /// finish, for up to 30 seconds, saves what is typed in the text fields,
    /// then stops ccc's whole process group and the helper, so quitting
    /// leaves nothing holding a port. An update stopped partway can leave
    /// `data/` missing or the edits stranded in `replay/`, and a submission
    /// stopped between opening the pull request and recording it opens a
    /// second one next time.
    func shutdown() async {
        let deadline = ContinuousClock.now + .seconds(30)
        while updating || submitting, ContinuousClock.now < deadline {
            try? await Task.sleep(for: .milliseconds(50))
        }
        // a draft waits for an update to finish, which this one has not
        if !updating { _ = await commitPendingDrafts() }
        shuttingDown = true
        await stopProcesses()
    }

    private func stopProcesses() async {
        await stopPreview()
        buildServer?.stop()
        buildServer = nil
        helper = nil
    }

    func select(_ file: String) async {
        guard let helper else { return }
        // a document's editor reads it as text; as YAML it would only be reported broken
        guard Self.loadsAsData(file, catalog: catalog) else {
            document = nil
            value = nil
            documentFile = file
            problems = []
            return
        }
        do {
            let loaded = try await helper.load(file)
            // a later selection's load owns the document now
            guard selection == file else { return }
            document = HoursDocument(value: loaded.value)
            value = loaded.value
            documentFile = file
            problems = loaded.problems
        } catch {
            guard selection == file else { return }
            document = nil
            value = nil
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
    /// selected file. Does nothing during an update, while a submission sends,
    /// to a file with an open conflict, whose set-aside copy the edit would
    /// replace, or while another edit waits for its reply. Returns whether the helper took the edit.
    @discardableResult
    func apply(_ ops: [EditOp], to file: String) async -> Bool {
        guard !updating, !sending, !editing, let helper, !isConflicted(file), !ops.isEmpty else { return false }
        let set = catalog?.set(for: file).flatMap { catalog?.sets[$0] }
        let ops = Self.stamped(ops, field: set?.stampOnSave, today: Self.stampForToday())
        let edited: Loaded
        do {
            edited = try await edits.run { try await helper.edit(file, ops) }
        } catch {
            if file == selection { problems = [Problem(file: file, message: error.localizedDescription, path: nil)] }
            return false
        }
        changedFiles = (try? workspace.changedFiles()) ?? changedFiles
        if file == selection {
            document = HoursDocument(value: edited.value)
            value = edited.value
            documentFile = file
            problems = edited.problems
        }
        // an edit may rename a record, as a contact's title does
        if let set = catalog?.set(for: file), records[set] != nil { await loadRecords(set) }
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
        /// saved in its schedule, which has moved; the field, still in the old
        /// place, takes `current`, what that place now holds
        case savedElsewhere(current: String)
        /// The draft's schedule changed beyond the drafted text, or is gone,
        /// so no schedule is surely the one it was typed for. The field takes
        /// `current`, and the typed text stays in sight in `draftNotices`.
        case letGo(current: String)
    }

    /// Where a draft at `path` belongs in `current`: the one schedule that
    /// still holds what `schedule` held besides the drafted field, wherever
    /// it has moved. Nil when none does, or more than one, so a draft is
    /// never written into a schedule it was not typed for.
    static func draftPath(_ path: [PathKey], schedule: JSONValue, in current: JSONValue) -> [PathKey]? {
        guard path.count >= 2, case .key(let field)? = path.last,
              case .array(let schedules)? = current[path: Array(path.dropLast(2))] else { return nil }
        func withoutField(_ value: JSONValue) -> JSONValue? {
            guard case .object(var object) = value else { return nil }
            object[field] = nil
            return .object(object)
        }
        let wanted = withoutField(schedule)
        let matches = schedules.indices.filter { withoutField(schedules[$0]) == wanted }
        guard matches.count == 1 else { return nil }
        return path.dropLast(2) + [.index(matches[0]), .key(field)]
    }

    /// Saves a text field's draft, `op` setting the text at its path in
    /// `file`. Waits for an edit or an update in flight, then writes into the
    /// schedule the draft was typed for, `schedule` being what it held when
    /// the draft began, wherever it has moved and whatever its drafted text
    /// became: what was typed is the newest word. A draft is never written
    /// into a schedule that cannot be told for its own.
    func applyDraft(_ op: EditOp, to file: String, replacing expected: String, schedule: JSONValue?) async -> DraftOutcome {
        while true {
            // a short wait: an edit takes one helper round trip, an update a download
            while editing || updating {
                if shuttingDown { return .notSaved }
                try? await Task.sleep(for: .milliseconds(50))
            }
            guard let helper else { return .notSaved }
            let current: JSONValue
            do {
                current = try await helper.load(file).value
            } catch {
                return .notSaved
            }
            let held = current[path: op.path]?.string ?? ""
            // the file unchanged at the draft's place keeps it there, though
            // the contributor's own edits to the schedule since make it unlike `schedule`
            guard let target = schedule.flatMap({ Self.draftPath(op.path, schedule: $0, in: current) })
                ?? (held == expected ? op.path : nil) else {
                if file == selection { await select(file) }
                let typed = op.value?.string ?? ""
                draftNotices.append(Problem(file: file, message: "“\(typed)” wasn't saved because its schedule changed while you typed.", path: op.path))
                return .letGo(current: held)
            }
            if await apply([op.moved(to: target)], to: file) {
                return target == op.path ? .saved : .savedElsewhere(current: held)
            }
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

    /// Each text field's way to save its draft now, by the field's id. A
    /// toolbar button or quitting takes no focus from the field, so nothing
    /// else would tell it the contributor is done.
    private var draftSavers: [UUID: @MainActor () async -> Bool] = [:]

    /// Lets `commitPendingDrafts` save the field `id`'s draft through `save`,
    /// which returns whether nothing typed there is left unsaved.
    func registerDraftSaver(_ id: UUID, _ save: @escaping @MainActor () async -> Bool) { draftSavers[id] = save }

    func unregisterDraftSaver(_ id: UUID) { draftSavers[id] = nil }

    /// Saves what is typed in every text field, and returns whether all of it
    /// was saved. Changes and Submit call it first, so they show and send the
    /// text, and so does quitting, so the text is not lost.
    func commitPendingDrafts() async -> Bool {
        var saved = true
        for save in Array(draftSavers.values) where await !save() { saved = false }
        return saved
    }

    /// Builds the data into `out/`. Skipped during an update, which reloads
    /// everything and builds once it is done.
    private func rebuild() async {
        guard !updating, let helper else { return }
        do {
            buildProblems = try await build(with: helper)
        } catch {
            buildProblems = [Problem(file: nil, message: "The build did not run", path: nil)]
        }
        hasBuilt = true
        cccLog = await ccc?.log ?? []
    }

    /// The open file's own problems, as a contributor reads them. Another
    /// file's problems show on the Overview, not in this file's editor.
    var shownProblems: [Problem] { plainProblems(Self.editorProblems(of: documentFile, open: problems, build: buildProblems)) }

    /// The problems an editor of `file` shows: its own, from the last check
    /// and the last build, each once. A check walks the whole schedule graph,
    /// so it reports other files' problems too, which the Overview lists.
    static func editorProblems(of file: String?, open: [Problem], build: [Problem]) -> [Problem] {
        var seen = Set<Problem>()
        return (open + build).filter { $0.file == file && seen.insert($0).inserted }
    }

    /// The days of the week in the order this Mac's region starts them.
    var week: [Weekday] { Weekday.inWeekOrder(firstWeekday: Calendar.current.firstWeekday) }

    /// Whether a build has run since launch, so the Overview can say how the preview stands.
    private(set) var hasBuilt = false

    /// What Current changes' Overview shows, and what its list and the Changesets window mark.
    var overviewParts: OverviewParts {
        OverviewParts.make(history: submissions, newerCommit: newerCommit, conflicts: conflicts, changedFiles: changedFiles,
                           checkProblems: problems, buildProblems: buildProblems, hasBuilt: hasBuilt)
    }

    func revert(_ file: String) async {
        guard !updating, !submitting else { return }
        try? workspace.revert(file)
        await afterFilesChanged()
    }

    /// Drops every edit and conflict in Current changes. Refused during an
    /// update or a submission, which read `data/` underneath it.
    func discardAll() async {
        guard !updating, !submitting else { return }
        try? workspace.discardAll()
        conflicts = workspace.conflicts
        await afterFilesChanged()
    }

    /// Each changed building with what changed in it, in words, for Suggest.
    func changeDescriptions() async -> [ChangedFile] {
        guard let helper else { return [] }
        var files: [ChangedFile] = []
        for file in changedFiles {
            // a file the contributor deleted has nothing to describe
            guard let now = try? await helper.load(file).value else { continue }
            var before: HoursDocument?
            if let base = try? workspace.baseContents(of: file) {
                before = (try? await helper.parse(Self.text(base))).map(HoursDocument.init(value:))
            }
            files.append(ChangedFile(record: name(of: file),
                                     changes: describeChange(from: before, to: HoursDocument(value: now))))
        }
        return files
    }

    private static func text(_ data: Data?) -> String { data.map { String(decoding: $0, as: UTF8.self) } ?? "" }

    func diff(for file: String) -> [DiffLine] {
        lineDiff(old: Self.text(try? workspace.baseContents(of: file)), new: Self.text(try? workspace.contents(of: file)))
    }

    /// The contributor's version of a conflicted file compared with GitHub's
    /// (`github`, nil once GitHub removed it), or nil if they deleted it.
    static func conflictDiff(github: Data?, mine: Workspace.ConflictCopy) -> [DiffLine]? {
        guard case .kept(let kept) = mine else { return nil }
        return lineDiff(old: text(github), new: text(kept))
    }

    /// What the contributor has in a conflicted `file`, set aside while GitHub's version sits in `data/`.
    func conflictCopy(of file: String) -> Workspace.ConflictCopy? { workspace.conflictCopy(of: file) }

    /// See `conflictDiff(github:mine:)`.
    func conflictDiff(for file: String) -> [DiffLine]? {
        conflictCopy(of: file).flatMap { Self.conflictDiff(github: try? workspace.contents(of: file), mine: $0) }
    }

    /// Whether a submission after a pull request in `state` opens a new one:
    /// a merged or closed pull request takes no more commits.
    static func opensNewPullRequest(after state: SubmissionState) -> Bool { state.isFinished }

    /// Opens a pull request, or adds a commit to the open one. Refuses during
    /// an update, which may have removed a file it has not yet put back, and
    /// would send that file as deleted. Builds first and refuses data that
    /// does not build, since nothing else may have built it this session.
    /// Asks GitHub for the earlier pull request's state first, and stops if
    /// it cannot tell, since guessing "none" would open a second one.
    /// Why a submission may not start: an update may have removed a file it
    /// would send as deleted, and a second submission while one runs could
    /// open a second pull request, since each window's Overview has a Submit.
    static func submitRefusal(updating: Bool, submitting: Bool, conflicted: Bool) -> Refusal? {
        if submitting { return .submitting }
        if updating { return .updating }
        if conflicted { return .conflicts }
        return nil
    }

    func submit(summary: String) async throws {
        if let refusal = Self.submitRefusal(updating: updating, submitting: submitting, conflicted: !conflicts.isEmpty) { throw refusal }
        guard let base = baseCommit else { throw Refusal.notReady }
        // held before the first wait, which would let a second Submit or an update in
        submitting = true
        defer {
            submitting = false
            sending = false
        }
        // what is typed in a field goes with the rest
        if await !commitPendingDrafts() { throw Refusal.unsavedText }
        guard let helper else { throw Refusal.notReady }
        sending = true
        buildProblems = try await build(with: helper)
        if !buildProblems.isEmpty { throw Refusal.buildProblems }
        let submitter = GitHubSubmitter(tokens: tokens)
        let changes = changedFiles.map { Change(path: "data/\($0)", contents: try? workspace.contents(of: $0)) }
        // what is sent, kept so the pull request's changes show without GitHub
        let sent = Dictionary(uniqueKeysWithValues: changedFiles.map { ($0, diffRows(diff(for: $0))) })
        if let current = currentSubmission {
            let state: SubmissionState
            do {
                state = try await submitter.state(of: current.submission)
            } catch {
                submissions.take(.failure(error), for: current.id, failures: &checkFailures)
                throw error
            }
            submissions.take(.success(state), for: current.id, failures: &checkFailures)
            if !Self.opensNewPullRequest(after: state) {
                submissions.replace(try await submitter.update(current.submission, changes: changes, summary: summary))
                submissions.saveDiffs(sent, saved: .now, for: current.id)
                await refreshSubmissions()
                return
            }
        }
        let opened = try await submitter.submit(changes: changes, base: base, summary: summary, appVersion: appVersion)
        submissions.add(SubmissionRecord(submission: opened, summary: summary, submitted: .now, state: nil))
        submissions.saveDiffs(sent, saved: .now, for: opened.number)
        await refreshSubmissions()
    }

    /// Asks GitHub after each pull request not yet merged or closed. A
    /// finished one cannot change, so it is not asked after. A failed check
    /// keeps the state GitHub last gave. UI tests reach no server.
    func refreshSubmissions() async {
        guard testOxfmt == nil else { return }
        let submitter = GitHubSubmitter(tokens: tokens)
        for record in submissions.needingCheck {
            let result: Result<SubmissionState, any Error>
            do {
                result = .success(try await submitter.state(of: record.submission))
            } catch {
                result = .failure(error)
            }
            submissions.take(result, for: record.id, failures: &checkFailures)
        }
    }

    /// Why a past pull request's diffs are not GitHub's latest.
    enum DiffLoad: Equatable {
        case loading
        /// GitHub could not be asked or did not answer; the kept diffs stand
        case failed
        /// GitHub says the pull request no longer exists
        case gone
    }

    /// The pull requests whose diffs are being asked for, or whose last ask failed, by number.
    private(set) var diffLoad: [Int: DiffLoad] = [:]

    /// Asks GitHub for pull request `number`'s files, unless they can no
    /// longer change. What GitHub sends replaces the kept diffs; a failure
    /// keeps them, and `diffLoad` says which failure. UI tests reach no server.
    func loadDiffs(of number: Int) async {
        guard !runsUnderUITests, diffLoad[number] != .loading,
              let record = submissions.records.first(where: { $0.id == number }), record.needsFetch else { return }
        diffLoad[number] = .loading
        let begun = Date.now
        do {
            let files = try await GitHubSubmitter(tokens: tokens).files(of: record.submission)
            submissions.take(files: files, begun: begun, for: number)
            diffLoad[number] = nil
        } catch {
            diffLoad[number] = (error as? SubmitError)?.isGone == true ? .gone : .failed
        }
    }

    /// Lets go of pull request `number`, which GitHub will not show, so the next submission opens a new one.
    func forgetSubmission(_ number: Int) {
        submissions.forget(number)
        checkFailures.clear(number)
    }

    /// What the Current changes window shows. A pull request's window keeps
    /// its own, since only Current changes has text fields to save.
    private(set) var item: ChangesetItem = .overview

    /// Counts choices, so one that waited for the text fields to save gives
    /// way to any made meanwhile.
    private var choices = 0

    /// Saves what is typed in the text fields, which the choice may take off
    /// screen, and reports whether the choice may go ahead: all of it saved,
    /// so none leaves the screen unsaved, and no newer choice made meanwhile.
    private func mayChoose() async -> Bool {
        choices += 1
        let choice = choices
        let saved = await commitPendingDrafts()
        return saved && choice == choices
    }

    /// Shows `item` in the Current changes window. A record's file opens for
    /// editing, unless it is already open. A set lists its records, and a set
    /// that is one record, as a whole file or a document is, opens it.
    func choose(_ item: ChangesetItem) async {
        guard await mayChoose() else { return }
        if let set = item.set {
            chosenSet = set
            if records[set] == nil { await loadRecords(set) }
        }
        var item = item
        if case .set(let set) = item, let only = records[set], only.count == 1,
           let shape = catalog?.sets[set]?.shape, shape != .folder, shape != .list {
            item = .record(set: set, only[0].ref)
        }
        self.item = item
        if case .record(_, let ref) = item { selection = ref.file }
    }

    /// The schema of one record of `set`, asked once.
    func schema(for set: String) async -> JSONValue? {
        if let known = schemas[set] { return known }
        guard let schema = try? await helper?.schema(set: set) else { return nil }
        schemas[set] = schema
        return schema
    }

    /// A document's text, as the workspace holds it now.
    func readText(_ file: String) async -> String? { try? await helper?.readText(file) }

    /// Replaces a document's text, then refreshes what follows from a changed file.
    func writeText(_ file: String, _ text: String) async -> Bool {
        guard !updating, !sending, let helper, !isConflicted(file) else { return false }
        do {
            try await helper.writeText(file, text)
        } catch {
            return false
        }
        changedFiles = (try? workspace.changedFiles()) ?? changedFiles
        await builds.schedule { await self.rebuild() }
        return true
    }

    /// What a contributor calls `file`. See `recordName(of:catalog:records:)`.
    func name(of file: String) -> String { recordName(of: file, catalog: catalog, records: records) }

    /// Lists `set`'s records afresh.
    func loadRecords(_ set: String) async {
        guard let helper, let listed = try? await helper.records(set: set).records else { return }
        records[set] = listed
    }

    /// Where the record at `ref` is in `after`, a set's records once one
    /// before it was removed or they were reordered: the record in the same
    /// file with the same title. Nil when there is none, and the item falls
    /// back to the set.
    static func follow(_ ref: RecordRef, before: [RecordSummary], after: [RecordSummary]) -> RecordRef? {
        guard let title = before.first(where: { $0.ref == ref })?.title else { return nil }
        if let same = after.first(where: { $0.ref.file == ref.file && $0.title == title }) { return same.ref }
        // a reordered folder renames its files, so a title only it has finds it
        let titled = after.filter { $0.title == title }
        return titled.count == 1 ? titled[0].ref : nil
    }

    /// Whether records may be added, removed or moved now: not while the data
    /// updates, a submission sends, or an edit waits for its reply.
    var mayChangeRecords: Bool { !updating && !sending && !editing && helper != nil }

    /// Takes a set's records after an add, remove or move, keeps the record on
    /// screen in view wherever it went, and refreshes what follows from changed files.
    private func took(_ reply: RecordsReply, in set: String, showing created: RecordRef? = nil) async {
        let before = records[set] ?? []
        records[set] = reply.records
        changedFiles = (try? workspace.changedFiles()) ?? changedFiles
        if let created {
            item = .record(set: set, created)
            selection = created.file
        } else if case .record(set, let ref) = item {
            if let followed = Self.follow(ref, before: before, after: reply.records) {
                item = .record(set: set, followed)
                if selection != followed.file { selection = followed.file } else { await select(followed.file) }
            } else {
                item = .set(set)
                selection = nil
            }
        }
        await builds.schedule { await self.rebuild() }
    }

    /// Adds a record titled `title` to `set`, in `section` when the set has sections, and opens it.
    func createRecord(in set: String, title: String, section: String?) async {
        guard mayChangeRecords, let helper, await mayChoose(),
              let reply = try? await helper.create(set: set, title: title, section: section) else { return }
        await took(reply, in: set, showing: reply.created?.ref)
    }

    /// Removes the record at `ref` from `set`.
    func removeRecord(_ ref: RecordRef, from set: String) async {
        guard mayChangeRecords, let helper, await mayChoose(),
              let reply = try? await helper.remove(set: set, record: ref) else { return }
        await took(reply, in: set)
    }

    /// Puts `set`'s records in the order of `order`.
    func reorderRecords(in set: String, order: [RecordRef]) async {
        guard mayChangeRecords, let helper, await mayChoose(),
              let reply = try? await helper.reorder(set: set, order: order) else { return }
        await took(reply, in: set)
    }

    /// What shows `file` for editing: its record, when its set lists it whole,
    /// or else its set.
    func item(showing file: String) -> ChangesetItem {
        guard let set = catalog?.set(for: file) else { return .set(chosenSet) }
        if catalog?.sets[set]?.shape == .folder || records[set]?.count == 1 {
            return .record(set: set, records[set]?.first { $0.ref.file == file }?.ref ?? RecordRef(file: file, path: []))
        }
        return .set(set)
    }

    /// Asks Pages whether master's data deploy has moved past the data being edited, so
    /// a session left open for days is offered the newer data. UI tests reach no server.
    func refreshNewerCommit() async {
        guard testOxfmt == nil, let latest = try? await workspace.latestPublished().commit else { return }
        newerCommit = latest == workspace.snapshot?.commit ? nil : latest
    }

    /// Moves to master's newest commit, keeping the contributor's edits.
    /// Does nothing while a submission is being sent from `data/`. A failed
    /// update leaves the workspace as it was, so it reports in `updateError`
    /// and editing goes on.
    func updateWorkspace() async {
        guard !updating, !submitting else { return }
        updating = true
        updateError = nil
        // an edit already sent writes into data/ when its reply comes, after the update has saved the edits
        while editing { try? await Task.sleep(for: .milliseconds(50)) }
        do {
            conflicts = try await workspace.updateToLatest()
        } catch is Workspace.NeedsNewerApp {
            updating = false
            phase = .needsAppUpdate
            return
        } catch {
            updating = false
            updateError = error.localizedDescription
            conflicts = workspace.conflicts
            await afterFilesChanged()
            return
        }
        updating = false
        newerCommit = nil
        // the update brought the helper published with the new data
        do {
            helper = try await workspace.loadHelper(oxfmt: testOxfmt ?? runtime.oxfmt)
        } catch is Workspace.NeedsNewerApp {
            phase = .needsAppUpdate
            return
        } catch {
            phase = .failed(error.localizedDescription)
            return
        }
        await afterFilesChanged()
    }

    /// Clears a failed update's message once the contributor has read it.
    func dismissUpdateError() { updateError = nil }

    /// Clears a let-go draft's notice once the contributor has copied what they need from it.
    func dismissDraftNotice(_ notice: Problem) { draftNotices.removeAll { $0 == notice } }

    func keepMine(_ file: String) async {
        guard !updating, !submitting else { return }
        try? workspace.keepMine(file)
        conflicts = workspace.conflicts
        await afterFilesChanged()
    }

    func keepLatest(_ file: String) async {
        guard !updating, !submitting else { return }
        try? workspace.keepLatest(file)
        conflicts = workspace.conflicts
        await afterFilesChanged()
    }

    /// The helper reads files afresh for each request, so only the lists, the open file and the build need refreshing.
    private func afterFilesChanged() async {
        changedFiles = (try? workspace.changedFiles()) ?? []
        calendar = (try? await helper?.calendar()) ?? calendar
        for set in records.keys { await loadRecords(set) }
        if let selection { await select(selection) }
        await rebuild()
    }

    /// The Mac's Bonjour name (Sharing → Local hostname), without `.local`.
    static func localHostName() -> String {
        (SCDynamicStoreCopyLocalHostName(nil) as String?) ?? ProcessInfo.processInfo.hostName.replacingOccurrences(of: ".local", with: "")
    }
}
