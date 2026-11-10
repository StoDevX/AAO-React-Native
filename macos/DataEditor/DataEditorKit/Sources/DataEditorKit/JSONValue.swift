import Foundation

/// Any JSON value, as the helper sends a data file.
public enum JSONValue: Codable, Hashable, Sendable {
    case string(String)
    case number(Double)
    case bool(Bool)
    case null
    case array([JSONValue])
    case object([String: JSONValue])

    public init(from decoder: any Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() { self = .null }
        else if let value = try? container.decode(Bool.self) { self = .bool(value) }
        else if let value = try? container.decode(Double.self) { self = .number(value) }
        else if let value = try? container.decode(String.self) { self = .string(value) }
        else if let value = try? container.decode([JSONValue].self) { self = .array(value) }
        else { self = .object(try container.decode([String: JSONValue].self)) }
    }

    public func encode(to encoder: any Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let value): try container.encode(value)
        case .number(let value): try container.encode(value)
        case .bool(let value): try container.encode(value)
        case .null: try container.encodeNil()
        case .array(let value): try container.encode(value)
        case .object(let value): try container.encode(value)
        }
    }

    public subscript(key: String) -> JSONValue? {
        if case .object(let object) = self { object[key] } else { nil }
    }

    public subscript(index: Int) -> JSONValue? {
        if case .array(let array) = self, array.indices.contains(index) { array[index] } else { nil }
    }

    public var string: String? { if case .string(let value) = self { value } else { nil } }
    public var array: [JSONValue]? { if case .array(let value) = self { value } else { nil } }
    public var bool: Bool? { if case .bool(let value) = self { value } else { nil } }
}

/// One step of a path into a data file: a key or an index.
public enum PathKey: Codable, Hashable, Sendable, ExpressibleByStringLiteral, ExpressibleByIntegerLiteral {
    case key(String)
    case index(Int)

    public init(stringLiteral value: String) { self = .key(value) }
    public init(integerLiteral value: Int) { self = .index(value) }

    public init(from decoder: any Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let index = try? container.decode(Int.self) { self = .index(index) }
        else { self = .key(try container.decode(String.self)) }
    }

    public func encode(to encoder: any Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .key(let key): try container.encode(key)
        case .index(let index): try container.encode(index)
        }
    }
}

extension PathKey: CustomStringConvertible {
    /// How a problem's path reads in the editor: `schedule › #1 › hours`.
    public var description: String {
        switch self {
        case .key(let key): key
        case .index(let index): "#\(index + 1)"
        }
    }
}

/// An edit the helper applies to a data file: set a value at a path, or delete it.
public struct EditOp: Encodable, Hashable, Sendable {
    public let path: [PathKey]
    public let value: JSONValue?
    public let delete: Bool

    public static func set(_ path: [PathKey], _ value: JSONValue) -> EditOp { EditOp(path: path, value: value, delete: false) }
    public static func delete(_ path: [PathKey]) -> EditOp { EditOp(path: path, value: nil, delete: true) }

    private enum CodingKeys: String, CodingKey { case path, value, delete }

    public func encode(to encoder: any Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(path, forKey: .path)
        if delete { try container.encode(true, forKey: .delete) } else { try container.encode(value ?? .null, forKey: .value) }
    }
}

/// Something wrong with the data, at a path inside `file` when the helper could place it.
public struct Problem: Decodable, Hashable, Sendable {
    public let file: String?
    public let message: String
    public let path: [PathKey]?

    public init(file: String?, message: String, path: [PathKey]?) {
        self.file = file
        self.message = message
        self.path = path
    }
}

extension JSONEncoder {
    /// Keys in order, so a line always starts with its `id`.
    static var sorted: JSONEncoder {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys, .withoutEscapingSlashes]
        return encoder
    }
}
