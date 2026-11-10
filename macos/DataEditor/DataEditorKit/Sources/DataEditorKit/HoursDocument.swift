import Foundation

/// A day as the data files write it.
public enum Weekday: String, CaseIterable, Sendable, Hashable {
    case Mo, Tu, We, Th, Fr, Sa, Su

    public var next: Weekday { Self.allCases[(Self.allCases.firstIndex(of: self)! + 1) % 7] }

    public var label: String {
        ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][Self.allCases.firstIndex(of: self)!]
    }
}

/// A time of day as the data files write it: `7:30am`.
public struct ClockTime: Comparable, Hashable, Sendable {
    /// minutes since midnight, 0..<1440
    public let minutes: Int

    public init(minutes: Int) { self.minutes = ((minutes % 1440) + 1440) % 1440 }

    public init?(_ text: String) {
        guard let match = text.wholeMatch(of: /(1[0-2]|[1-9]):([0-5]\d)(am|pm)/),
              let hour = Int(match.1), let minute = Int(match.2) else { return nil }
        let base = hour % 12 + (match.3 == "pm" ? 12 : 0)
        self.init(minutes: base * 60 + minute)
    }

    public var text: String {
        let hour = minutes / 60
        let twelve = hour % 12 == 0 ? 12 : hour % 12
        return "\(twelve):\(String(format: "%02d", minutes % 60))\(hour < 12 ? "am" : "pm")"
    }

    public static func < (a: ClockTime, b: ClockTime) -> Bool { a.minutes < b.minutes }

    public static let quarterHours: [ClockTime] = stride(from: 0, to: 1440, by: 15).map(ClockTime.init(minutes:))
}

/// One row of hours: some days, open from one time to another.
public struct HoursRow: Hashable, Sendable {
    /// A stretch of one day that a row covers, in minutes since midnight.
    public struct Segment: Hashable, Sendable {
        public let day: Weekday
        public let start: Int
        public let end: Int
    }

    public let days: [Weekday]
    public let fromText: String
    public let toText: String
    public var from: ClockTime? { ClockTime(fromText) }
    public var to: ClockTime? { ClockTime(toText) }

    public init(days: [Weekday], fromText: String, toText: String) {
        self.days = days
        self.fromText = fromText
        self.toText = toText
    }

    /// The stretches of each day this row covers. A close at or before the open
    /// runs past midnight into the next day; midnight to midnight is all day.
    public func segments() -> [Segment] {
        guard let from, let to else { return [] }
        return days.flatMap { day -> [Segment] in
            if to.minutes > from.minutes { return [Segment(day: day, start: from.minutes, end: to.minutes)] }
            if to.minutes == 0 { return [Segment(day: day, start: from.minutes, end: 1440)] }
            return [Segment(day: day, start: from.minutes, end: 1440), Segment(day: day.next, start: 0, end: to.minutes)]
        }
    }
}

/// One service block: a title, its rows, and how it is marked.
public struct Service: Hashable, Sendable {
    public let title: String
    public let notes: String?
    public let isPhysicallyOpen: Bool?
    public let rows: [HoursRow]
}

func services(in value: JSONValue?) -> [Service] {
    (value?.array ?? []).map { block in
        Service(
            title: block["title"]?.string ?? "",
            notes: block["notes"]?.string,
            isPhysicallyOpen: block["isPhysicallyOpen"]?.bool,
            rows: (block["hours"]?.array ?? []).map { row in
                HoursRow(
                    days: (row["days"]?.array ?? []).compactMap { $0.string.flatMap(Weekday.init(rawValue:)) },
                    fromText: row["from"]?.string ?? "",
                    toText: row["to"]?.string ?? ""
                )
            }
        )
    }
}

/// An hours file, read for the editor.
public struct HoursDocument: Sendable {
    public enum BreakEntry: Hashable, Sendable {
        /// a template named in breaks.yaml
        case template(String)
        /// this building's own hours for the break
        case custom([Service])
        /// a schedule with its own exceptions, which the editor shows but does not edit
        case other
    }

    public let value: JSONValue
    public init(value: JSONValue) { self.value = value }

    public var name: String { value["name"]?.string ?? "" }
    public var category: String { value["category"]?.string ?? "" }
    public var services: [Service] { DataEditorKit.services(in: value["schedule"]) }

    public var exceptions: [(date: String, services: [Service])] {
        (value["exceptions"]?.array ?? []).map { ($0["date"]?.string ?? "", DataEditorKit.services(in: $0["schedule"])) }
    }

    public var breakSchedule: [String: BreakEntry] {
        guard case .object(let entries)? = value["breakSchedule"] else { return [:] }
        return entries.mapValues { entry in
            if let name = entry.string { return .template(name) }
            if entry.array != nil { return .custom(DataEditorKit.services(in: entry)) }
            return .other
        }
    }
}

/// Builds the edits for one schedule, wherever in the file it is.
public struct ScheduleEditor: Sendable {
    public enum End: String, Sendable { case from, to }

    public let base: [PathKey]
    public let services: [Service]

    public init(base: [PathKey], services: [Service]) {
        self.base = base
        self.services = services
    }

    private func path(_ service: Int, _ rest: PathKey...) -> [PathKey] { base + [.index(service)] + rest }

    public func setTitle(service: Int, _ title: String) -> EditOp { .set(path(service, "title"), .string(title)) }

    public func setNotes(service: Int, _ notes: String?) -> EditOp {
        guard let notes, !notes.isEmpty else { return .delete(path(service, "notes")) }
        return .set(path(service, "notes"), .string(notes))
    }

    public func setTime(service: Int, row: Int, end: End, _ time: ClockTime) -> EditOp {
        .set(path(service, "hours", .index(row), .key(end.rawValue)), .string(time.text))
    }

    /// Days in week order, as the files write them.
    public func setDays(service: Int, row: Int, _ days: [Weekday]) -> EditOp {
        let ordered = Weekday.allCases.filter(days.contains)
        return .set(path(service, "hours", .index(row), "days"), .array(ordered.map { .string($0.rawValue) }))
    }

    public func addRow(service: Int) -> EditOp {
        .set(path(service, "hours", .index(services[service].rows.count)), .object([
            "days": .array(["Mo", "Tu", "We", "Th", "Fr"].map(JSONValue.string)),
            "from": .string("9:00am"), "to": .string("5:00pm"),
        ]))
    }

    public func removeRow(service: Int, row: Int) -> EditOp { .delete(path(service, "hours", .index(row))) }

    public func addService(title: String) -> EditOp {
        .set(base + [.index(services.count)], .object([
            "title": .string(title),
            "hours": .array([.object(["days": .array([.string("Mo")]), "from": .string("9:00am"), "to": .string("5:00pm")])]),
        ]))
    }

    /// Nil for the last service: a schedule needs at least one.
    public func removeService(_ service: Int) -> EditOp? {
        services.count > 1 ? .delete(base + [.index(service)]) : nil
    }

    /// Marks a service closed (no rows, not physically open), or open again.
    public func setClosed(service: Int, _ closed: Bool) -> [EditOp] {
        closed
            ? [.set(path(service, "hours"), .array([])), .set(path(service, "isPhysicallyOpen"), .bool(false))]
            : [.delete(path(service, "isPhysicallyOpen")), addRow(service: service)]
    }
}
