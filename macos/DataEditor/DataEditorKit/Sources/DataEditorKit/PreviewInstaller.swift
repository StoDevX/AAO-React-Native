import CryptoKit
import Foundation

/// Downloads what the phone preview runs on, at its first start: Node,
/// checked against the SHA-256 the app carries, and ccc-server at the pinned
/// commit, with its dependencies installed by that Node's npm. Each is put
/// together in a staging folder beside its install and renamed into place only
/// once whole, so a stopped or failed install leaves nothing taken for ready.
public struct PreviewInstaller: Sendable {
    public struct Failure: LocalizedError, Equatable, Sendable {
        public let message: String
        public var errorDescription: String? { message }
        public init(message: String) { self.message = message }
    }

    /// Installs ccc-server's dependencies in `folder` with `node`.
    public typealias RunNpm = @Sendable (_ node: URL, _ folder: URL) async throws -> Void

    private let root: URL
    private let node: NodeRelease
    private let cccCommit: String
    private let session: URLSession
    private let runNpm: RunNpm

    public init(root: URL, node: NodeRelease, cccCommit: String, session: URLSession = .shared, runNpm: RunNpm? = nil) {
        self.root = root
        self.node = node
        self.cccCommit = cccCommit
        self.session = session
        self.runNpm = runNpm ?? Self.npmCi(cache: root.appending(path: "npm-cache"))
    }

    private var nodeFolder: URL { root.appending(path: "node") }
    private var cccFolder: URL { root.appending(path: "ccc") }
    public var nodeExecutable: URL { nodeFolder.appending(path: "\(node.version)/bin/node") }
    public var cccRoot: URL { cccFolder.appending(path: cccCommit) }

    private var nodeIsReady: Bool { FileManager.default.isExecutableFile(atPath: nodeExecutable.path) }
    private var cccIsReady: Bool { FileManager.default.fileExists(atPath: cccRoot.appending(path: "node_modules").path) }
    public var isReady: Bool { nodeIsReady && cccIsReady }

    /// Installs whatever is missing, then removes other versions' folders and staging left by a stopped install.
    public func install() async throws {
        if !nodeIsReady {
            try await assemble(in: nodeFolder, as: node.version) { staging in
                let archive = try await download(node.url)
                let digest = SHA256.hash(data: archive).map { String(format: "%02x", $0) }.joined()
                guard digest == node.sha256 else { throw Failure(message: "Node's download did not match its checksum.") }
                try await unpack(archive, into: staging)
            }
        }
        if !cccIsReady {
            try await assemble(in: cccFolder, as: cccCommit) { staging in
                try await unpack(try await download(URL(string: "https://codeload.github.com/frog-pond/ccc-server/tar.gz/\(cccCommit)")!), into: staging)
                try await runNpm(nodeExecutable, staging)
            }
        }
        removeAll(in: nodeFolder, but: node.version)
        removeAll(in: cccFolder, but: cccCommit)
    }

    /// Builds `name` in a staging folder inside `folder` with `body`, then renames it into place.
    private func assemble(in folder: URL, as name: String, _ body: (URL) async throws -> Void) async throws {
        let fm = FileManager.default
        let staging = folder.appending(path: ".staging-\(UUID().uuidString)")
        try fm.createDirectory(at: staging, withIntermediateDirectories: true)
        do {
            try await body(staging)
            try Task.checkCancellation()
            try? fm.removeItem(at: folder.appending(path: name))
            try fm.moveItem(at: staging, to: folder.appending(path: name))
        } catch {
            try? fm.removeItem(at: staging)
            throw error
        }
    }

    private func removeAll(in folder: URL, but kept: String) {
        let fm = FileManager.default
        for name in (try? fm.contentsOfDirectory(atPath: folder.path)) ?? [] where name != kept {
            try? fm.removeItem(at: folder.appending(path: name))
        }
    }

    private func download(_ url: URL) async throws -> Data {
        let (data, response) = try await session.data(from: url)
        guard let status = (response as? HTTPURLResponse)?.statusCode, (200..<300).contains(status) else {
            throw Failure(message: "Couldn't download \(url.absoluteString).")
        }
        return data
    }

    /// Unpacks a gzipped tarball's one top folder into `folder`.
    private func unpack(_ archive: Data, into folder: URL) async throws {
        let file = folder.deletingLastPathComponent().appending(path: "\(folder.lastPathComponent).tar.gz")
        try archive.write(to: file)
        defer { try? FileManager.default.removeItem(at: file) }
        try await Self.run(URL(filePath: "/usr/bin/tar"), ["-xzf", file.path, "-C", folder.path, "--strip-components", "1"], in: folder, environment: [:])
    }

    /// `npm ci` from Node's own npm, with Node's `bin` first on `PATH`, so install scripts run on that Node.
    private static func npmCi(cache: URL) -> RunNpm {
        { node, folder in
            let bin = node.deletingLastPathComponent()
            let npm = bin.deletingLastPathComponent().appending(path: "lib/node_modules/npm/bin/npm-cli.js")
            try await run(node, [npm.path, "ci", "--no-audit", "--no-fund"], in: folder, environment: [
                "PATH": "\(bin.path):/usr/bin:/bin",
                "HOME": cache.deletingLastPathComponent().path,
                "npm_config_cache": cache.path,
            ])
        }
    }

    /// Runs `executable`, ending it if the task is cancelled, and fails with its last lines of output.
    static func run(_ executable: URL, _ arguments: [String], in folder: URL, environment: [String: String]) async throws {
        let process = Process()
        let output = Pipe()
        process.executableURL = executable
        process.arguments = arguments
        process.currentDirectoryURL = folder
        if !environment.isEmpty { process.environment = environment }
        process.standardOutput = output
        process.standardError = output
        let collected = Collected()
        output.fileHandleForReading.readabilityHandler = { collected.append($0.availableData) }
        let launch = Launch(process)
        try await withTaskCancellationHandler {
            try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, any Error>) in
                process.terminationHandler = { _ in continuation.resume() }
                do { try launch.start() } catch { continuation.resume(throwing: error) }
            }
        } onCancel: {
            launch.stop()
        }
        output.fileHandleForReading.readabilityHandler = nil
        try Task.checkCancellation()
        guard process.terminationStatus == 0 else {
            let lines = String(decoding: collected.data, as: UTF8.self).split(separator: "\n").suffix(20).joined(separator: "\n")
            throw Failure(message: "\(executable.lastPathComponent) exited with status \(process.terminationStatus)\n\(lines)")
        }
    }
}

/// Starts a process unless a Stop came first, and ends it if one comes
/// after. Ending a process that never started raises an exception, and a
/// Stop can land at any moment, so the two are decided under one lock.
private final class Launch: @unchecked Sendable {
    private let lock = NSLock()
    private let process: Process
    private var started = false
    private var stopped = false

    init(_ process: Process) { self.process = process }

    func start() throws {
        try lock.withLock {
            if stopped { throw CancellationError() }
            try process.run()
            started = true
        }
    }

    func stop() {
        lock.withLock {
            stopped = true
            if started { process.terminate() }
        }
    }
}

/// Output gathered from a pipe's handler, which runs on its own queue.
private final class Collected: @unchecked Sendable {
    private let lock = NSLock()
    private var stored = Data()
    func append(_ more: Data) { lock.withLock { stored.append(more) } }
    var data: Data { lock.withLock { stored } }
}
