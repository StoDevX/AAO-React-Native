import CryptoKit
import Foundation
import Testing
@testable import DataEditorKit

/// A gzipped tarball holding `files` (path → text) under one top folder, as Node's archive and GitHub's are.
private func tarball(_ files: [String: String]) throws -> Data {
    let fm = FileManager.default
    let folder = fm.temporaryDirectory.appending(path: "tarball \(UUID().uuidString)")
    for (path, text) in files {
        let file = folder.appending(path: "top/\(path)")
        try fm.createDirectory(at: file.deletingLastPathComponent(), withIntermediateDirectories: true)
        try Data(text.utf8).write(to: file)
        try fm.setAttributes([.posixPermissions: 0o755], ofItemAtPath: file.path)
    }
    let archive = folder.appending(path: "out.tar.gz")
    let tar = Process()
    tar.executableURL = URL(filePath: "/usr/bin/tar")
    tar.arguments = ["-czf", archive.path, "-C", folder.path, "top"]
    // not waitUntilExit, which runs the run loop: a stub's reply could then
    // read the archive this builds while its initializer still runs
    let finished = DispatchSemaphore(value: 0)
    tar.terminationHandler = { _ in finished.signal() }
    try tar.run()
    finished.wait()
    return try Data(contentsOf: archive)
}

private let nodeArchive = try! tarball(["bin/node": "#!/bin/sh\n", "lib/node_modules/npm/bin/npm-cli.js": ""])
private let cccArchive = try! tarball(["package.json": "{}", "source/dev/index.ts": ""])
private let nodeURL = URL(string: "https://nodejs.org/dist/v24.22.0/node-v24.22.0-darwin-arm64.tar.gz")!
private let cccURL = "https://codeload.github.com/frog-pond/ccc-server/tar.gz/cda256d"

private func release(sha256: String = SHA256.hash(data: nodeArchive).map { String(format: "%02x", $0) }.joined()) -> NodeRelease {
    NodeRelease(version: "24.22.0", url: nodeURL, sha256: sha256)
}

/// Serves both archives, and fails everything else.
private func session() -> URLSession {
    StubProtocol.session { request in
        switch request.url!.absoluteString {
        case nodeURL.absoluteString: (200, nodeArchive)
        case cccURL: (200, cccArchive)
        default: (404, Data())
        }
    }.0
}

/// Stands in for `npm ci`: makes node_modules, as a finished install leaves it.
private let fakeNpm: PreviewInstaller.RunNpm = { _, folder in
    try FileManager.default.createDirectory(at: folder.appending(path: "node_modules"), withIntermediateDirectories: true)
}

private func entries(_ folder: URL) -> [String] {
    ((try? FileManager.default.contentsOfDirectory(atPath: folder.path)) ?? []).sorted()
}

private func temporaryRoot() -> URL {
    FileManager.default.temporaryDirectory.appending(path: "preview \(UUID().uuidString)")
}

struct PreviewInstallerTests {
    @Test func installsNodeAndCccServer() async throws {
        let root = temporaryRoot()
        let installer = PreviewInstaller(root: root, node: release(), cccCommit: "cda256d", session: session(), runNpm: fakeNpm)
        #expect(!installer.isReady)
        try await installer.install()
        #expect(installer.isReady)
        #expect(installer.nodeExecutable == root.appending(path: "node/24.22.0/bin/node"))
        #expect(FileManager.default.isExecutableFile(atPath: installer.nodeExecutable.path))
        #expect(FileManager.default.fileExists(atPath: root.appending(path: "ccc/cda256d/source/dev/index.ts").path))
        #expect(entries(root.appending(path: "node")) == ["24.22.0"])
        #expect(entries(root.appending(path: "ccc")) == ["cda256d"])
    }

    @Test func runsNpmWithTheDownloadedNode() async throws {
        let root = temporaryRoot()
        let seen = Seen()
        let installer = PreviewInstaller(root: root, node: release(), cccCommit: "cda256d", session: session()) { node, folder in
            seen.set(node)
            try await fakeNpm(node, folder)
        }
        try await installer.install()
        #expect(seen.value == installer.nodeExecutable)
    }

    @Test func refusesNodeWhoseChecksumDiffers() async throws {
        let root = temporaryRoot()
        let installer = PreviewInstaller(root: root, node: release(sha256: String(repeating: "0", count: 64)), cccCommit: "cda256d",
                                         session: session(), runNpm: fakeNpm)
        await #expect(throws: PreviewInstaller.Failure(message: "Node's download did not match its checksum.")) { try await installer.install() }
        #expect(entries(root.appending(path: "node")) == [])
        #expect(!installer.isReady)
    }

    @Test func leavesNothingInstalledWhenNpmFails() async throws {
        let root = temporaryRoot()
        let installer = PreviewInstaller(root: root, node: release(), cccCommit: "cda256d", session: session()) { _, _ in
            throw PreviewInstaller.Failure(message: "npm said no")
        }
        await #expect(throws: PreviewInstaller.Failure(message: "npm said no")) { try await installer.install() }
        #expect(entries(root.appending(path: "ccc")) == [])
        #expect(!installer.isReady)
    }

    /// Stop during the install cancels it; what it had begun must not pass for an install.
    @Test func takesNoStagingFolderForAnInstall() async throws {
        let root = temporaryRoot()
        let started = Seen()
        let installer = PreviewInstaller(root: root, node: release(), cccCommit: "cda256d", session: session()) { node, folder in
            started.set(folder)
            try await Task.sleep(for: .seconds(30))
            try await fakeNpm(node, folder)
        }
        let task = Task { try await installer.install() }
        while started.value == nil { try await Task.sleep(for: .milliseconds(20)) }
        task.cancel()
        await #expect(throws: CancellationError.self) { try await task.value }
        #expect(entries(root.appending(path: "ccc")) == [])
        #expect(!installer.isReady)
    }

    /// A Stop that lands before tar or npm starts must stop it from starting, not crash ending it.
    @Test func stopsAProgramThatHasNotStarted() async throws {
        let task = Task {
            withUnsafeCurrentTask { $0?.cancel() }
            try await PreviewInstaller.run(URL(filePath: "/bin/sleep"), ["5"], in: FileManager.default.temporaryDirectory, environment: [:])
        }
        await #expect(throws: CancellationError.self) { try await task.value }
    }

    @Test func reusesWhatIsInstalled() async throws {
        let root = temporaryRoot()
        try await PreviewInstaller(root: root, node: release(), cccCommit: "cda256d", session: session(), runNpm: fakeNpm).install()
        let offline = StubProtocol.session { _ in (-1, Data()) }.0
        let again = PreviewInstaller(root: root, node: release(), cccCommit: "cda256d", session: offline, runNpm: fakeNpm)
        #expect(again.isReady)
        try await again.install()
    }

    @Test func removesOtherVersionsOnceReady() async throws {
        let root = temporaryRoot()
        let fm = FileManager.default
        for old in ["node/22.0.0/bin", "node/.staging-old", "ccc/0ld", "ccc/.staging-old"] {
            try fm.createDirectory(at: root.appending(path: old), withIntermediateDirectories: true)
        }
        try await PreviewInstaller(root: root, node: release(), cccCommit: "cda256d", session: session(), runNpm: fakeNpm).install()
        #expect(entries(root.appending(path: "node")) == ["24.22.0"])
        #expect(entries(root.appending(path: "ccc")) == ["cda256d"])
    }
}

/// A value set from another task.
private final class Seen: @unchecked Sendable {
    private let lock = NSLock()
    private var stored: URL?
    func set(_ value: URL) { lock.withLock { stored = value } }
    var value: URL? { lock.withLock { stored } }
}
