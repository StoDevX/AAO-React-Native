import Foundation

/// One schedule of a bus line as a timetable: its stops across, one row per
/// trip, each a time at each stop or nil where the trip skips it (`false` in
/// the file). The edits it builds are at `base`, the schedule's path.
public struct BusSchedule: Equatable, Sendable {
    public let stops: [String]
    public let trips: [[ClockTime?]]
    /// each stop's coordinates, by its name
    public let coordinates: [String: JSONValue]
    /// each trip's times as the file holds them, which a whole row rewritten keeps
    private let raw: [[JSONValue]]

    public init(_ schedule: JSONValue) {
        stops = schedule["stops"]?.array?.compactMap(\.string) ?? []
        raw = (schedule["times"]?.array ?? []).map { $0.array ?? [] }
        trips = raw.map { row in row.map { $0.string.flatMap(ClockTime.init) } }
        if case .object(let object)? = schedule["coordinates"] { coordinates = object } else { coordinates = [:] }
    }

    private static func json(_ time: ClockTime?) -> JSONValue { time.map { .string($0.text) } ?? .bool(false) }

    private static func row(_ trip: [ClockTime?]) -> JSONValue { .array(trip.map(json)) }

    /// What the file holds at trip `trip` and stop `stop`, as text.
    public func written(trip: Int, stop: Int) -> String? {
        guard raw.indices.contains(trip), raw[trip].indices.contains(stop) else { return nil }
        return raw[trip][stop].fieldText
    }

    /// Each cell, as trip and stop, holding something other than a time the grid
    /// reads or `false`, such as `3:8pm`, which the schema allows: shown as written.
    public var unreadable: [[Int]] {
        raw.enumerated().flatMap { trip, row in
            row.enumerated().compactMap { stop, value in value == .bool(false) || value.string.flatMap(ClockTime.init) != nil ? nil : [trip, stop] }
        }
    }

    /// Every trip with its row of times changed by `change`, each cell as the file holds it.
    private func rows(at base: [PathKey], _ change: (inout [JSONValue]) -> Void) -> [EditOp] {
        raw.enumerated().map { trip, times in
            var row = times
            change(&row)
            return .set(base + ["times", .index(trip)], .array(row))
        }
    }

    /// Sets trip `trip`'s time at stop `stop`, or marks the stop skipped when `time` is nil.
    public func setTime(trip: Int, stop: Int, _ time: ClockTime?, at base: [PathKey]) -> [EditOp] {
        [.set(base + ["times", .index(trip), .index(stop)], Self.json(time))]
    }

    /// A trip after the last: the last again, as far after it as it is after
    /// the one before, which is another run of the same loop. After a single
    /// trip, a copy of it; in an empty timetable, a trip that skips every stop.
    /// A time the grid can't read is copied as written.
    public func addTrip(at base: [PathKey]) -> [EditOp] {
        guard let last = trips.last, let written = raw.last else {
            return [.set(base + ["times", .index(trips.count)], Self.row(Array(repeating: nil, count: stops.count)))]
        }
        let gap = trips.count < 2 ? 0 : zip(trips[trips.count - 2], last).lazy
            .compactMap { before, after in before.flatMap { b in after.map { $0.minutes - b.minutes } } }.first ?? 0
        let next: [JSONValue] = zip(last, written).map { time, held in
            time.map { Self.json(ClockTime(minutes: (($0.minutes + gap) % 1440 + 1440) % 1440)) } ?? held
        }
        return [.set(base + ["times", .index(trips.count)], .array(next))]
    }

    /// Where a stop trip `trip` skips starts when given a time: the time at the
    /// stop before it, or noon, read only as far as the trip's row goes.
    public func startingTime(trip: Int, stop: Int) -> ClockTime {
        guard trips.indices.contains(trip) else { return ClockTime(minutes: 720) }
        return trips[trip].prefix(stop).compactMap { $0 }.last ?? ClockTime(minutes: 720)
    }

    /// Removes the trips at `indices`, the last first, so each place still names its trip.
    public func removeTrips(_ indices: IndexSet, at base: [PathKey]) -> [EditOp] {
        indices.reversed().map { .delete(base + ["times", .index($0)]) }
    }

    /// The stops, and every trip, with a stop `name` at `index` that every trip skips until given a time.
    public func insertStop(_ name: String, at index: Int, at base: [PathKey]) -> [EditOp] {
        var names = stops
        names.insert(name, at: index)
        return [.set(base + ["stops"], .array(names.map(JSONValue.string)))]
            + rows(at: base) { $0.insert(.bool(false), at: min(index, $0.count)) }
    }

    /// The stops, and every trip, without the stop at `index`.
    public func removeStop(at index: Int, at base: [PathKey]) -> [EditOp] {
        var names = stops
        names.remove(at: index)
        return [.set(base + ["stops"], .array(names.map(JSONValue.string)))]
            + rows(at: base) { if $0.indices.contains(index) { $0.remove(at: index) } }
    }

    /// The stops, and every trip, with the stop at `from` and its times moved to `to`.
    public func moveStop(from: Int, to: Int, at base: [PathKey]) -> [EditOp] {
        var names = stops
        names.insert(names.remove(at: from), at: to)
        return [.set(base + ["stops"], .array(names.map(JSONValue.string)))]
            + rows(at: base) { row in
                // a row short of the stops skips those it lacks, so its times move with theirs
                while row.count < stops.count { row.append(.bool(false)) }
                row.insert(row.remove(at: from), at: to)
            }
    }

    /// Renames the stop at `index`, and its coordinates with it, unless another
    /// stop still goes by the old name, as the Express's two St. Olaf stops do.
    public func renameStop(at index: Int, to name: String, at base: [PathKey]) -> [EditOp] {
        let old = stops[index]
        var ops: [EditOp] = [.set(base + ["stops", .index(index)], .string(name))]
        let stillNamed = stops.enumerated().contains { $0.offset != index && $0.element == old }
        if !stillNamed, let place = coordinates[old], coordinates[name] == nil {
            ops += [.delete(base + ["coordinates", .key(old)]), .set(base + ["coordinates", .key(name)], place)]
        }
        return ops
    }

    /// Each time earlier than the time before it in its trip, which runs forward.
    public func outOfOrder() -> [(trip: Int, stop: Int)] {
        trips.enumerated().flatMap { trip, times in
            var latest: ClockTime?
            return times.enumerated().compactMap { stop, time -> (trip: Int, stop: Int)? in
                guard let time else { return nil }
                defer { latest = time }
                return latest.map { time < $0 } == true ? (trip, stop) : nil
            }
        }
    }
}
