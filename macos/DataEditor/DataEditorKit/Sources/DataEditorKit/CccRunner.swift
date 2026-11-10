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
        /// Where the runner records the process group it started, so a later
        /// start can end one an app that quit without stopping it left behind.
        public let pidFile: URL?

        public init(executable: URL, arguments: [String], workingDirectory: URL, environment: [String: String], pidFile: URL? = nil) {
            self.executable = executable
            self.arguments = arguments
            self.workingDirectory = workingDirectory
            self.environment = environment
            self.pidFile = pidFile
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
                ],
                pidFile: state.appending(path: "ccc.pid")
            )
        }
    }

    public private(set) var status: Status = .stopped { didSet { for continuation in watchers.values { continuation.yield(status) } } }
    public private(set) var log: [String] = []

    private let configuration: Configuration
    private let restartLimit: Int
    private let ready: @Sendable () async -> Bool
    private let stopGracePeriod: Duration
    private let readinessAttempts: Int
    private let readinessInterval: Duration
    private var process: GroupProcess?
    private var reachedRunning = false
    private var outputDrained = false
    private var restarts = 0
    private var stopping = false
    private var watchers: [UUID: AsyncStream<Status>.Continuation] = [:]

    /// `ready` says whether the Worker answers yet; the default asks `GET /` on port 8787.
    /// `stop()` sends SIGKILL to a process still alive `stopGracePeriod` after SIGTERM, and the runner
    /// ends a process that has not answered after `readinessAttempts` tries `readinessInterval` apart.
    public init(
        configuration: Configuration,
        restartLimit: Int = 3,
        ready: (@Sendable () async -> Bool)? = nil,
        stopGracePeriod: Duration = .seconds(5),
        readinessAttempts: Int = 120,
        readinessInterval: Duration = .milliseconds(500)
    ) {
        self.configuration = configuration
        self.restartLimit = restartLimit
        self.stopGracePeriod = stopGracePeriod
        self.readinessAttempts = readinessAttempts
        self.readinessInterval = readinessInterval
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

    /// Does nothing while a process is running or starting.
    public func start() {
        guard process == nil else { return }
        stopping = false
        restarts = 0
        launch()
    }

    /// Returns once the process has exited, killing its group if it ignores
    /// the request to end. Whatever of the group outlives it is killed too.
    public func stop() async {
        stopping = true
        guard let launched = process else { return }
        launched.signalGroup(SIGTERM)
        let deadline = ContinuousClock.now + stopGracePeriod
        var killed = false
        while process === launched {
            if !killed && ContinuousClock.now >= deadline {
                launched.signalGroup(SIGKILL)
                killed = true
            }
            try? await Task.sleep(for: .milliseconds(20))
        }
        launched.signalGroup(SIGKILL)
        if let pidFile = configuration.pidFile, (try? String(contentsOf: pidFile, encoding: .utf8)) == record(of: launched) {
            try? FileManager.default.removeItem(at: pidFile)
        }
    }

    /// What the pid file says of `launched`: its group and when its leader started.
    private func record(of launched: GroupProcess) -> String {
        "\(launched.processIdentifier) \(launched.started)"
    }

    /// Kills the group the pid file names: one an app that quit without stopping
    /// ccc left holding the port. A group whose leader is alive but started at
    /// another time is not ccc's, since its id was reused, and is left alone.
    private func killLeftoverGroup() {
        guard let pidFile = configuration.pidFile, let text = try? String(contentsOf: pidFile, encoding: .utf8) else { return }
        let fields = text.split(separator: " ")
        if fields.count == 2, let group = pid_t(fields[0]), group > 1, group != getpgrp() {
            let leaderStart = startTime(of: group)
            if leaderStart == nil || leaderStart == String(fields[1]) { kill(-group, SIGKILL) }
        }
        try? FileManager.default.removeItem(at: pidFile)
    }

    private func launch() {
        reachedRunning = false
        outputDrained = false
        status = .starting
        killLeftoverGroup()
        let pipe = Pipe()
        let process: GroupProcess
        do {
            process = try GroupProcess(
                executable: configuration.executable, arguments: configuration.arguments,
                workingDirectory: configuration.workingDirectory, environment: configuration.environment,
                output: pipe.fileHandleForWriting
            ) { finished in
                Task { await self.exited(finished) }
            }
        } catch {
            append("could not start ccc: \(error.localizedDescription)")
            status = .crashed(-1)
            return
        }
        // the group holds the only write end, so the reader ends when the group does
        try? pipe.fileHandleForWriting.close()
        self.process = process
        if let pidFile = configuration.pidFile {
            try? FileManager.default.createDirectory(at: pidFile.deletingLastPathComponent(), withIntermediateDirectories: true)
            try? Data(record(of: process).utf8).write(to: pidFile, options: .atomic)
        }
        Task {
            do {
                for try await line in pipe.fileHandleForReading.bytes.lines { self.append(line) }
            } catch {
                self.append("could not read ccc's output: \(error.localizedDescription)")
            }
            self.outputDrained = true
        }
        Task { await waitUntilReady(process) }
    }

    private func waitUntilReady(_ launched: GroupProcess) async {
        for _ in 0..<readinessAttempts {
            guard process === launched, status == .starting else { return }
            if await ready() {
                if process === launched, status == .starting {
                    reachedRunning = true
                    restarts = 0
                    status = .running
                }
                return
            }
            try? await Task.sleep(for: readinessInterval)
        }
        guard process === launched, status == .starting else { return }
        append("ccc did not answer in time")
        launched.signalGroup(SIGTERM)
    }

    private func append(_ line: String) {
        log.append(line)
        if log.count > 500 { log.removeFirst(log.count - 500) }
    }

    private func exited(_ finished: GroupProcess) async {
        // a newer process may have replaced this one
        guard process === finished else { return }
        // the reader may still be draining the pipe, which a grandchild can hold open
        for _ in 0..<100 where !outputDrained {
            try? await Task.sleep(for: .milliseconds(20))
        }
        guard process === finished else { return }
        let code = finished.terminationStatus
        process = nil
        if stopping {
            status = .stopped
        } else if !reachedRunning, log.suffix(5).contains(where: { $0.contains("is in use") }) {
            status = .portInUse
        } else if restarts < restartLimit {
            restarts += 1
            launch()
        } else {
            status = .crashed(code)
        }
    }
}
