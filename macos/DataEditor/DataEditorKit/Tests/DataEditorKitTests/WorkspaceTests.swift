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

    @Test func comparesTreesWithTheBundledHelper() {
        let snapshot = Snapshot(commit: "c1", scriptsTree: "s", modulesTree: "m")
        #expect(snapshot.isCompatible(with: HelperStamp(scriptsTree: "s", modulesTree: "m")))
        #expect(!snapshot.isCompatible(with: HelperStamp(scriptsTree: "s2", modulesTree: "m")))
    }
}
