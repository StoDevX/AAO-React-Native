import Foundation
import Testing
@testable import DataEditorKit

/// A repo at `commit` with one data file, the image groups and one image.
private func stubRepo(commit: String = "c1", failing failPath: String? = nil, cageHours: String = "name: The Cage\n") -> (URLSession, StubProtocol.Stub) {
    StubProtocol.session { request in
        let url = request.url!.absoluteString
        if let failPath, url.hasSuffix(failPath) { return (-1, Data()) }
        switch url {
        case "https://api.github.com/repos/StoDevX/AAO-React-Native/commits/master":
            return (200, body(commit))
        case "https://api.github.com/repos/StoDevX/AAO-React-Native/git/trees/\(commit)":
            return (200, body(#"{"tree":[{"path":"data","type":"tree","sha":"tdata"},{"path":"images","type":"tree","sha":"timages"},{"path":"scripts","type":"tree","sha":"tscripts"},{"path":"modules","type":"tree","sha":"tmodules"}]}"#))
        case "https://api.github.com/repos/StoDevX/AAO-React-Native/git/trees/tdata?recursive=1":
            return (200, body(#"{"truncated":false,"tree":[{"path":"building-hours","type":"tree","sha":"x"},{"path":"building-hours/1-1-cage.yaml","type":"blob","sha":"a"}]}"#))
        case "https://api.github.com/repos/StoDevX/AAO-React-Native/git/trees/timages?recursive=1":
            return (200, body(#"{"truncated":false,"tree":[{"path":"groups.json","type":"blob","sha":"g"},{"path":"spaces/cage.webp","type":"blob","sha":"w"},{"path":"spaces/source/cage.jpg","type":"blob","sha":"j"}]}"#))
        case "https://raw.githubusercontent.com/StoDevX/AAO-React-Native/\(commit)/data/building-hours/1-1-cage.yaml":
            return (200, body(cageHours))
        case "https://raw.githubusercontent.com/StoDevX/AAO-React-Native/\(commit)/images/groups.json":
            return (200, body(#"["spaces"]"#))
        case "https://raw.githubusercontent.com/StoDevX/AAO-React-Native/\(commit)/images/spaces/cage.webp":
            return (200, body("RIFF"))
        default:
            return (404, Data())
        }
    }
}

/// The real workspace lives under Application Support, so the folder name has a space.
private func temporaryRoot() -> URL {
    FileManager.default.temporaryDirectory.appending(path: "workspace \(UUID().uuidString)")
}

/// Set from a stub's response closure, which runs off the test's task.
private final class Flag: @unchecked Sendable {
    private let lock = NSLock()
    private var value = false
    func set() { lock.withLock { value = true } }
    var isSet: Bool { lock.withLock { value } }
}

struct WorkspaceTests {
    @Test func downloadsTheDataAndThePublishedImages() async throws {
        let (session, stub) = stubRepo()
        let workspace = Workspace(root: temporaryRoot(), session: session)
        let snapshot = try await workspace.download(commit: try await workspace.latestCommit())
        #expect(snapshot == Snapshot(commit: "c1", scriptsTree: "tscripts", modulesTree: "tmodules"))
        #expect(workspace.snapshot == snapshot)
        #expect(try workspace.contents(of: "building-hours/1-1-cage.yaml") == body("name: The Cage\n"))
        #expect(FileManager.default.fileExists(atPath: workspace.root.appending(path: "images/spaces/cage.webp").path))
        // the source photos are not published, so not fetched
        #expect(!stub.requests.contains { $0.url!.path.hasSuffix("cage.jpg") })
    }

    @Test func listsAndRevertsChangedFiles() async throws {
        let (session, _) = stubRepo()
        let workspace = Workspace(root: temporaryRoot(), session: session)
        _ = try await workspace.download(commit: "c1")
        #expect(try workspace.changedFiles() == [])
        try body("name: The Cage Grill\n").write(to: workspace.dataDirectory.appending(path: "building-hours/1-1-cage.yaml"))
        #expect(try workspace.changedFiles() == ["building-hours/1-1-cage.yaml"])
        try workspace.revert("building-hours/1-1-cage.yaml")
        #expect(try workspace.changedFiles() == [])
    }

    @Test func leavesTheWorkspaceAloneWhenADownloadFailsPartway() async throws {
        let root = temporaryRoot()
        let (good, _) = stubRepo()
        _ = try await Workspace(root: root, session: good).download(commit: "c1")
        let (failing, _) = stubRepo(failing: "cage.webp", cageHours: "name: Changed\n")
        let workspace = Workspace(root: root, session: failing)
        await #expect(throws: URLError.self) { _ = try await workspace.download(commit: "c1") }
        #expect(workspace.snapshot?.commit == "c1")
        #expect(try workspace.contents(of: "building-hours/1-1-cage.yaml") == body("name: The Cage\n"))
        #expect(try workspace.changedFiles() == [])
    }

    @Test func keepsEditsWhenUpdatingPastCommitsThatDidNotTouchThem() async throws {
        let root = temporaryRoot()
        let (c1, _) = stubRepo()
        _ = try await Workspace(root: root, session: c1).download(commit: "c1")
        try body("name: The Cage Grill\n").write(to: root.appending(path: "data/building-hours/1-1-cage.yaml"))
        let (c2, _) = stubRepo(commit: "c2")
        let workspace = Workspace(root: root, session: c2)
        #expect(try await workspace.update(to: "c2") == [])
        #expect(workspace.snapshot?.commit == "c2")
        #expect(try workspace.contents(of: "building-hours/1-1-cage.yaml") == body("name: The Cage Grill\n"))
    }

    @Test func setsAsideAnEditThatMasterAlsoChanged() async throws {
        let root = temporaryRoot()
        let (c1, _) = stubRepo()
        _ = try await Workspace(root: root, session: c1).download(commit: "c1")
        try body("name: The Cage Grill\n").write(to: root.appending(path: "data/building-hours/1-1-cage.yaml"))
        let (c2, _) = stubRepo(commit: "c2", cageHours: "name: The Cage at Buntrock\n")
        let workspace = Workspace(root: root, session: c2)
        #expect(try await workspace.update(to: "c2") == ["building-hours/1-1-cage.yaml"])
        #expect(workspace.conflicts == ["building-hours/1-1-cage.yaml"])
        #expect(try workspace.contents(of: "building-hours/1-1-cage.yaml") == body("name: The Cage at Buntrock\n"))
        #expect(workspace.conflictCopy(of: "building-hours/1-1-cage.yaml") == .kept(body("name: The Cage Grill\n")))
        try workspace.keepMine("building-hours/1-1-cage.yaml")
        #expect(workspace.conflicts == [])
        #expect(try workspace.contents(of: "building-hours/1-1-cage.yaml") == body("name: The Cage Grill\n"))
    }

    @Test func treatsAMergedEditAsNoConflict() async throws {
        let root = temporaryRoot()
        let (c1, _) = stubRepo()
        _ = try await Workspace(root: root, session: c1).download(commit: "c1")
        try body("name: The Cage Grill\n").write(to: root.appending(path: "data/building-hours/1-1-cage.yaml"))
        let (c2, _) = stubRepo(commit: "c2", cageHours: "name: The Cage Grill\n")
        let workspace = Workspace(root: root, session: c2)
        #expect(try await workspace.update(to: "c2") == [])
        #expect(try workspace.changedFiles() == [])
    }

    @Test func keepsAnOpenConflictThroughAnotherUpdate() async throws {
        let root = temporaryRoot()
        let (c1, _) = stubRepo()
        _ = try await Workspace(root: root, session: c1).download(commit: "c1")
        try body("name: The Cage Grill\n").write(to: root.appending(path: "data/building-hours/1-1-cage.yaml"))
        let (c2, _) = stubRepo(commit: "c2", cageHours: "name: The Cage at Buntrock\n")
        _ = try await Workspace(root: root, session: c2).update(to: "c2")
        let (c3, _) = stubRepo(commit: "c3", cageHours: "name: The Cage at Buntrock\n")
        let workspace = Workspace(root: root, session: c3)
        #expect(try await workspace.update(to: "c3") == ["building-hours/1-1-cage.yaml"])
        try workspace.keepMine("building-hours/1-1-cage.yaml")
        #expect(try workspace.contents(of: "building-hours/1-1-cage.yaml") == body("name: The Cage Grill\n"))
    }

    @Test func keepsADeletionThatMasterAlsoChanged() async throws {
        let root = temporaryRoot()
        let (c1, _) = stubRepo()
        _ = try await Workspace(root: root, session: c1).download(commit: "c1")
        try FileManager.default.removeItem(at: root.appending(path: "data/building-hours/1-1-cage.yaml"))
        let (c2, _) = stubRepo(commit: "c2", cageHours: "name: The Cage at Buntrock\n")
        let workspace = Workspace(root: root, session: c2)
        #expect(try await workspace.update(to: "c2") == ["building-hours/1-1-cage.yaml"])
        #expect(workspace.conflicts == ["building-hours/1-1-cage.yaml"])
        #expect(workspace.conflictCopy(of: "building-hours/1-1-cage.yaml") == .deleted)
        try workspace.keepMine("building-hours/1-1-cage.yaml")
        #expect(workspace.conflicts == [])
        #expect(workspace.conflictCopy(of: "building-hours/1-1-cage.yaml") == nil)
        #expect(try workspace.contents(of: "building-hours/1-1-cage.yaml") == nil)
    }

    @Test func writesEditsToDiskBeforeDownloading() async throws {
        let root = temporaryRoot()
        let (c1, _) = stubRepo()
        _ = try await Workspace(root: root, session: c1).download(commit: "c1")
        try body("name: The Cage Grill\n").write(to: root.appending(path: "data/building-hours/1-1-cage.yaml"))
        let saved = Flag()
        let (c2, _) = StubProtocol.session { request in
            let saveFile = root.appending(path: "replay/mine/building-hours/1-1-cage.yaml")
            if FileManager.default.fileExists(atPath: saveFile.path) { saved.set() }
            return (404, Data())
        }
        await #expect(throws: URLError.self) { _ = try await Workspace(root: root, session: c2).update(to: "c2") }
        #expect(saved.isSet)
        #expect(try Workspace(root: root, session: c2).contents(of: "building-hours/1-1-cage.yaml") == body("name: The Cage Grill\n"))
    }

    @Test func putsTheOldFilesBackWhenTheSwapFails() async throws {
        let root = temporaryRoot()
        let (c1, _) = stubRepo()
        _ = try await Workspace(root: root, session: c1).download(commit: "c1")
        // a folder where the snapshot goes makes the last step of the swap fail
        let snapshotFile = root.appending(path: "snapshot.json")
        try FileManager.default.removeItem(at: snapshotFile)
        try FileManager.default.createDirectory(at: snapshotFile, withIntermediateDirectories: true)
        let (c2, _) = stubRepo(commit: "c2", cageHours: "name: Newer\n")
        let workspace = Workspace(root: root, session: c2)
        await #expect(throws: (any Error).self) { _ = try await workspace.download(commit: "c2") }
        #expect(try workspace.contents(of: "building-hours/1-1-cage.yaml") == body("name: The Cage\n"))
        #expect(try workspace.baseContents(of: "building-hours/1-1-cage.yaml") == body("name: The Cage\n"))
        #expect(FileManager.default.fileExists(atPath: root.appending(path: "images/spaces/cage.webp").path))
    }

    /// An immutable `previous/` cannot be cleared or written, so the first move
    /// of the swap, `data/`'s, fails while every original is still in place.
    @Test func keepsTheEditsWhenMovingDataAsideFails() async throws {
        let root = temporaryRoot()
        let (c1, _) = stubRepo()
        _ = try await Workspace(root: root, session: c1).download(commit: "c1")
        try body("name: The Cage Grill\n").write(to: root.appending(path: "data/building-hours/1-1-cage.yaml"))
        let previous = root.appending(path: "previous")
        try FileManager.default.createDirectory(at: previous, withIntermediateDirectories: true)
        try FileManager.default.setAttributes([.immutable: true], ofItemAtPath: previous.path)
        defer { try? FileManager.default.setAttributes([.immutable: false], ofItemAtPath: previous.path) }
        let (c2, _) = stubRepo(commit: "c2", cageHours: "name: Newer\n")
        let workspace = Workspace(root: root, session: c2)
        await #expect(throws: (any Error).self) { _ = try await workspace.update(to: "c2") }
        #expect(workspace.snapshot?.commit == "c1")
        #expect(try workspace.contents(of: "building-hours/1-1-cage.yaml") == body("name: The Cage Grill\n"))
        #expect(try workspace.baseContents(of: "building-hours/1-1-cage.yaml") == body("name: The Cage\n"))
        #expect(FileManager.default.fileExists(atPath: root.appending(path: "images/spaces/cage.webp").path))
    }

    @Test func keepsTheSavedEditsWhenDataIsNotIntactAfterAFailedUpdate() async throws {
        let root = temporaryRoot()
        let (c1, _) = stubRepo()
        _ = try await Workspace(root: root, session: c1).download(commit: "c1")
        let edited = root.appending(path: "data/building-hours/1-1-cage.yaml")
        try body("name: The Cage Grill\n").write(to: edited)
        // the edit vanishes from data/ while the download is under way
        let (c2, _) = StubProtocol.session { _ in
            try? FileManager.default.removeItem(at: edited)
            return (-1, Data())
        }
        await #expect(throws: URLError.self) { _ = try await Workspace(root: root, session: c2).update(to: "c2") }
        let saved = root.appending(path: "replay/mine/building-hours/1-1-cage.yaml")
        #expect((try? Data(contentsOf: saved)) == body("name: The Cage Grill\n"))
    }

    @Test func leavesEditsBaseAndSnapshotAloneWhenAnUpdateFailsOnTheNetwork() async throws {
        let root = temporaryRoot()
        let (c1, _) = stubRepo()
        _ = try await Workspace(root: root, session: c1).download(commit: "c1")
        try body("name: The Cage Grill\n").write(to: root.appending(path: "data/building-hours/1-1-cage.yaml"))
        let (failing, _) = stubRepo(commit: "c2", failing: "cage.webp", cageHours: "name: Newer\n")
        let workspace = Workspace(root: root, session: failing)
        await #expect(throws: URLError.self) { _ = try await workspace.update(to: "c2") }
        #expect(workspace.snapshot?.commit == "c1")
        #expect(try workspace.contents(of: "building-hours/1-1-cage.yaml") == body("name: The Cage Grill\n"))
        #expect(try workspace.baseContents(of: "building-hours/1-1-cage.yaml") == body("name: The Cage\n"))
        #expect(try workspace.changedFiles() == ["building-hours/1-1-cage.yaml"])
    }

    @Test func resolvesAConflictWithMastersVersion() async throws {
        let root = temporaryRoot()
        let (c1, _) = stubRepo()
        _ = try await Workspace(root: root, session: c1).download(commit: "c1")
        try body("name: The Cage Grill\n").write(to: root.appending(path: "data/building-hours/1-1-cage.yaml"))
        let (c2, _) = stubRepo(commit: "c2", cageHours: "name: The Cage at Buntrock\n")
        let workspace = Workspace(root: root, session: c2)
        #expect(try await workspace.update(to: "c2") == ["building-hours/1-1-cage.yaml"])
        try workspace.keepLatest("building-hours/1-1-cage.yaml")
        #expect(workspace.conflicts == [])
        #expect(try workspace.contents(of: "building-hours/1-1-cage.yaml") == body("name: The Cage at Buntrock\n"))
        #expect(try workspace.changedFiles() == [])
    }

    @Test func carriesAnAddedAndADeletedFileThroughAnUpdate() async throws {
        let root = temporaryRoot()
        let (c1, _) = stubRepo()
        _ = try await Workspace(root: root, session: c1).download(commit: "c1")
        try body("name: The Pause\n").write(to: root.appending(path: "data/building-hours/2-1-pause.yaml"))
        try FileManager.default.removeItem(at: root.appending(path: "data/building-hours/1-1-cage.yaml"))
        let (c2, _) = stubRepo(commit: "c2")
        let workspace = Workspace(root: root, session: c2)
        #expect(try await workspace.update(to: "c2") == [])
        #expect(workspace.snapshot?.commit == "c2")
        #expect(try workspace.contents(of: "building-hours/2-1-pause.yaml") == body("name: The Pause\n"))
        #expect(try workspace.contents(of: "building-hours/1-1-cage.yaml") == nil)
        #expect(try workspace.changedFiles() == ["building-hours/1-1-cage.yaml", "building-hours/2-1-pause.yaml"])
    }

    @Test func ignoresFilesThatAreNotData() async throws {
        let (session, _) = stubRepo()
        let workspace = Workspace(root: temporaryRoot(), session: session)
        _ = try await workspace.download(commit: "c1")
        try body("").write(to: workspace.dataDirectory.appending(path: "building-hours/.DS_Store"))
        try body("name: half written\n").write(to: workspace.dataDirectory.appending(path: "building-hours/_1-1-cage.yaml.next"))
        #expect(try workspace.changedFiles() == [])
    }

    @Test func comparesTreesWithTheBundledHelper() {
        let snapshot = Snapshot(commit: "c1", scriptsTree: "s", modulesTree: "m")
        #expect(snapshot.isCompatible(with: HelperStamp(scriptsTree: "s", modulesTree: "m")))
        #expect(!snapshot.isCompatible(with: HelperStamp(scriptsTree: "s2", modulesTree: "m")))
    }
}
