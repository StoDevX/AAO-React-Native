import Foundation

/// Runs ccc-server's dev script, restarts it if it crashes, and keeps the tail of its log.
public actor CccRunner {
    public enum Status: Equatable, Sendable {
        case stopped, starting, running, portInUse
        case crashed(Int32)
    }

    public struct Configuration: Sendable {
        public let executable: URL
        public let arguments: [String]
        public let workingDirectory: URL
        public let environment: [String: String]

        public init(executable: URL, arguments: [String], workingDirectory: URL, environment: [String: String]) {
            self.executable = executable
            self.arguments = arguments
            self.workingDirectory = workingDirectory
            self.environment = environment
        }

        /// The bundled ccc, serving St. Olaf's data from `pagesOrigin`, with its state under `state`.
        public static func bundled(node: URL, cccRoot: URL, pagesOrigin: String, state: URL) -> Configuration {
            Configuration(
                executable: node,
                arguments: ["source/dev/index.ts"],
                workingDirectory: cccRoot,
                environment: [
                    "PATH": "\(node.deletingLastPathComponent().path):/usr/bin:/bin",
                    "HOME": state.path,
                    "XDG_CONFIG_HOME": state.appending(path: "config").path,
                    "WRANGLER_SEND_METRICS": "false",
                    "PAGES_ORIGIN_OVERRIDE": pagesOrigin,
                    "CCC_PERSIST_TO": state.appending(path: "wrangler-state").path,
                ]
            )
        }
    }

    public private(set) var status: Status = .stopped { didSet { for continuation in watchers.values { continuation.yield(status) } } }
    public private(set) var log: [String] = []

    private let configuration: Configuration
    private let restartLimit: Int
    private let ready: @Sendable () async -> Bool
    private var process: Process?
    private var restarts = 0
    private var stopping = false
    private var watchers: [UUID: AsyncStream<Status>.Continuation] = [:]

    /// `ready` says whether the Worker answers yet; the default asks `GET /` on port 8787.
    public init(configuration: Configuration, restartLimit: Int = 3, ready: (@Sendable () async -> Bool)? = nil) {
        self.configuration = configuration
        self.restartLimit = restartLimit
        self.ready = ready ?? {
            var request = URLRequest(url: URL(string: "http://localhost:8787/")!)
            request.timeoutInterval = 5
            let status = (try? await URLSession.shared.data(for: request))?.1 as? HTTPURLResponse
            return status?.statusCode == 200
        }
    }

    /// Every status from now on, starting with the current one.
    public func statuses() -> AsyncStream<Status> {
        let id = UUID()
        let (stream, continuation) = AsyncStream<Status>.makeStream()
        continuation.yield(status)
        watchers[id] = continuation
        continuation.onTermination = { _ in Task { await self.unwatch(id) } }
        return stream
    }

    private func unwatch(_ id: UUID) { watchers[id] = nil }

    public func start() {
        stopping = false
        restarts = 0
        launch()
    }

    public func stop() {
        stopping = true
        process?.terminate()
    }

    private func launch() {
        status = .starting
        let process = Process()
        process.executableURL = configuration.executable
        process.arguments = configuration.arguments
        process.currentDirectoryURL = configuration.workingDirectory
        process.environment = configuration.environment
        let pipe = Pipe()
        process.standardOutput = pipe
        process.standardError = pipe
        process.terminationHandler = { finished in
            Task { await self.exited(finished.terminationStatus) }
        }
        do {
            try process.run()
        } catch {
            append("could not start ccc: \(error.localizedDescription)")
            status = .crashed(-1)
            return
        }
        self.process = process
        Task {
            do {
                for try await line in pipe.fileHandleForReading.bytes.lines { self.append(line) }
            } catch {
                self.append("could not read ccc's output: \(error.localizedDescription)")
            }
        }
        Task { await waitUntilReady(process) }
    }

    private func waitUntilReady(_ launched: Process) async {
        for _ in 0..<120 {
            guard process === launched, status == .starting else { return }
            if await ready() {
                if process === launched, status == .starting { status = .running }
                return
            }
            try? await Task.sleep(for: .milliseconds(500))
        }
    }

    private func append(_ line: String) {
        log.append(line)
        if log.count > 500 { log.removeFirst(log.count - 500) }
    }

    private func exited(_ code: Int32) async {
        // the reader may still be draining the pipe
        try? await Task.sleep(for: .milliseconds(100))
        process = nil
        if stopping {
            status = .stopped
        } else if log.suffix(5).contains(where: { $0.contains("is in use") }) {
            status = .portInUse
        } else if restarts < restartLimit {
            restarts += 1
            launch()
        } else {
            status = .crashed(code)
        }
    }
}
