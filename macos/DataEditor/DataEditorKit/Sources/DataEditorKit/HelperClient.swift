import Foundation

/// The pipeline helper's calls, typed, over the helper running in JavaScriptCore.
public struct HelperClient: Sendable {
    public struct Failure: LocalizedError, Equatable, Sendable {
        public let message: String
        public var errorDescription: String? { message }
        public init(message: String) { self.message = message }
    }

    private let runtime: HelperRuntime

    public init(runtime: HelperRuntime) { self.runtime = runtime }

    /// The protocol the loaded helper speaks.
    public var helperProtocol: Int { runtime.helperProtocol }

    /// Sends `method` and decodes its result as `R`.
    public func call<R: Decodable & Sendable>(_ method: String, _ params: some Encodable & Sendable) async throws -> R {
        let json = String(decoding: try JSONEncoder.sorted.encode(params), as: UTF8.self)
        let reply: String
        do {
            reply = try await runtime.call(method, paramsJSON: json)
        } catch let failure as HelperRuntime.Failure {
            throw Failure(message: failure.message)
        }
        return try JSONDecoder().decode(R.self, from: Data(reply.utf8))
    }
}

/// An hours file as the sidebar lists it.
public struct BuildingSummary: Decodable, Hashable, Sendable, Identifiable {
    public let file: String
    public let name: String
    public let category: String
    public var id: String { file }

    public init(file: String, name: String, category: String) {
        self.file = file
        self.name = name
        self.category = category
    }
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
    /// The folder the build went into, which the app serves when the build is good
    public let dir: String?

    private enum CodingKeys: String, CodingKey { case ok, problems, dir }
    public init(from decoder: any Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        ok = try container.decode(Bool.self, forKey: .ok)
        problems = try container.decodeIfPresent([Problem].self, forKey: .problems) ?? []
        dir = try container.decodeIfPresent(String.self, forKey: .dir)
    }
}

private struct NoParams: Encodable, Sendable {}
private struct FileParams: Encodable, Sendable { let file: String }
private struct EditParams: Encodable, Sendable { let file: String; let ops: [EditOp] }

extension HelperClient {
    public func buildings() async throws -> [BuildingSummary] { try await call("list", NoParams()) }
    public func calendar() async throws -> BreakCalendar { try await call("calendar", NoParams()) }
    public func load(_ file: String) async throws -> Loaded { try await call("load", FileParams(file: file)) }
    public func edit(_ file: String, _ ops: [EditOp]) async throws -> Loaded { try await call("edit", EditParams(file: file, ops: ops)) }
    public func build() async throws -> BuildResult { try await call("build", NoParams()) }
}
