import Foundation

/// The break calendar, `breaks.yaml`: the breaks by when they start, the
/// closure templates buildings name, and the edits that change them.
public struct BreaksDocument: Sendable {
    /// One break: a range of days, or one day written as `date`.
    public struct Break: Hashable, Sendable, Identifiable {
        public let key: String
        public let name: String
        public let start: String?
        public let end: String?
        public let date: String?
        public var id: String { key }
    }

    public let value: JSONValue
    public init(value: JSONValue) { self.value = value }

    /// The breaks in the order they come, a one-day break's date counting as its start; a break with neither last.
    public var breaks: [Break] {
        guard case .object(let entries)? = value["breaks"] else { return [] }
        return entries.map { key, entry in
            Break(key: key, name: entry["name"]?.string ?? key, start: entry["start"]?.string,
                  end: entry["end"]?.string, date: entry["date"]?.string)
        }
        .sorted { ($0.start ?? $0.date ?? "~", $0.key) < ($1.start ?? $1.date ?? "~", $1.key) }
    }

    /// The closure templates' names, which a building's break schedule may name.
    public var templates: [String] {
        guard case .object(let templates)? = value["templates"] else { return [] }
        return templates.keys.sorted()
    }

    /// Moves a break to run from `start` to `end`, inclusive.
    public func setDates(key: String, start: String, end: String) -> [EditOp] {
        [.set(["breaks", .key(key), "start"], .string(start)), .set(["breaks", .key(key), "end"], .string(end))]
    }

    /// Moves a one-day break to `date`.
    public func setDate(key: String, date: String) -> EditOp { .set(["breaks", .key(key), "date"], .string(date)) }

    /// Adds a break named `name`; its dates are for the contributor to fill in, and are a problem until they are.
    public func addBreak(key: String, name: String) -> EditOp { .set(["breaks", .key(key)], .object(["name": .string(name)])) }

    public func removeBreak(key: String) -> EditOp { .delete(["breaks", .key(key)]) }
}
