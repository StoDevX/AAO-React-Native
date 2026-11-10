import Foundation

/// The pipeline helper, a child process spoken to in JSON lines.
public actor HelperClient {
    public struct Failure: LocalizedError, Equatable, Sendable {
        public let message: String
        public var errorDescription: String? { message }
    }

    private struct Request<P: Encodable>: Encodable {
        let id: Int
        let method: String
        let params: P
    }

    private struct Reply: Decodable {
        struct Message: Decodable { let message: String }
        let id: Int?
        let result: JSONValue?
        let error: Message?
    }

    private let process = Process()
    private let input: FileHandle
    private let output: FileHandle
    private var nextID = 1
    private var pending: [Int: CheckedContinuation<JSONValue, any Error>] = [:]
    private var stopped = false

    public init(executable: URL, arguments: [String], environment: [String: String]? = nil) throws {
        let stdin = Pipe()
        let stdout = Pipe()
        process.executableURL = executable
        process.arguments = arguments
        if let environment { process.environment = environment }
        process.standardInput = stdin
        process.standardOutput = stdout
        process.standardError = FileHandle.standardError
        try process.run()
        input = stdin.fileHandleForWriting
        // a write to a helper that has died fails with EPIPE instead of killing the app
        _ = fcntl(input.fileDescriptor, F_SETNOSIGPIPE, 1)
        output = stdout.fileHandleForReading
    }

    /// Starts reading replies. Call once, before the first `call`.
    public func start() {
        Task { await listen() }
    }

    /// Reads replies until the helper's output closes. Replies end at "\n"
    /// alone: a value may hold U+2028, U+2029 or U+0085, which Node writes raw.
    private func listen() async {
        var reason = "The helper stopped"
        do {
            for try await line in lines(of: output) { receive(line) }
        } catch {
            reason = "The helper stopped: \(error.localizedDescription)"
        }
        stopped = true
        for continuation in pending.values { continuation.resume(throwing: Failure(message: reason)) }
        pending.removeAll()
    }

    /// Resumes the call `line` answers. The helper replies in order, so a line
    /// that will not decode belongs to the oldest call still waiting.
    private func receive(_ line: Data) {
        guard let reply = try? JSONDecoder().decode(Reply.self, from: line) else {
            guard let oldest = pending.keys.min(), let continuation = pending.removeValue(forKey: oldest) else { return }
            continuation.resume(throwing: Failure(message: "The helper sent a reply that is not JSON: \(String(decoding: line, as: UTF8.self))"))
            return
        }
        guard let id = reply.id, let continuation = pending.removeValue(forKey: id) else { return }
        if let error = reply.error {
            continuation.resume(throwing: Failure(message: error.message))
        } else {
            continuation.resume(returning: reply.result ?? .null)
        }
    }

    /// Sends `method` and decodes its result as `R`.
    public func call<R: Decodable & Sendable>(_ method: String, _ params: some Encodable & Sendable) async throws -> R {
        if stopped { throw Failure(message: "The helper stopped") }
        let id = nextID
        nextID += 1
        let line = try JSONEncoder.sorted.encode(Request(id: id, method: method, params: params)) + Data("\n".utf8)
        let result = try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<JSONValue, any Error>) in
            pending[id] = continuation
            do {
                try input.write(contentsOf: line)
            } catch {
                pending[id] = nil
                continuation.resume(throwing: error)
            }
        }
        return try JSONDecoder().decode(R.self, from: try JSONEncoder().encode(result))
    }

    /// Closes the helper's input, which is how it is told to stop.
    public func stop() {
        try? input.close()
    }
}

/// An hours file as the sidebar lists it.
public struct BuildingSummary: Decodable, Hashable, Sendable, Identifiable {
    public let file: String
    public let name: String
    public let category: String
    public var id: String { file }
}

/// The breaks a building may give its own hours for, and the templates it may name.
public struct BreakCalendar: Decodable, Hashable, Sendable {
    public struct Break: Decodable, Hashable, Sendable, Identifiable {
        public let key: String
        public let name: String
        public let start: String
        public let end: String
        public let templates: [String]
        public var id: String { key }
    }
    public let breaks: [Break]
    public let templates: [String]
}

/// A data file's value and what is wrong with it.
public struct Loaded: Decodable, Hashable, Sendable {
    public let value: JSONValue
    public let problems: [Problem]
}

/// Whether a build went in, and if not, why not.
public struct BuildResult: Decodable, Hashable, Sendable {
    public let ok: Bool
    public let problems: [Problem]

    private enum CodingKeys: String, CodingKey { case ok, problems }
    public init(from decoder: any Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        ok = try container.decode(Bool.self, forKey: .ok)
        problems = try container.decodeIfPresent([Problem].self, forKey: .problems) ?? []
    }
}

private struct Served: Decodable, Sendable { let port: Int }
private struct NoParams: Encodable, Sendable {}
private struct FileParams: Encodable, Sendable { let file: String }
private struct EditParams: Encodable, Sendable { let file: String; let ops: [EditOp] }
private struct PortParams: Encodable, Sendable { let port: Int }

extension HelperClient {
    public func buildings() async throws -> [BuildingSummary] { try await call("list", NoParams()) }
    public func calendar() async throws -> BreakCalendar { try await call("calendar", NoParams()) }
    public func load(_ file: String) async throws -> Loaded { try await call("load", FileParams(file: file)) }
    public func edit(_ file: String, _ ops: [EditOp]) async throws -> Loaded { try await call("edit", EditParams(file: file, ops: ops)) }
    public func build() async throws -> BuildResult { try await call("build", NoParams()) }
    /// Serves the build on every address at `port`, and returns the port it got.
    public func serve(port: Int) async throws -> Int { (try await call("serve", PortParams(port: port)) as Served).port }
}
