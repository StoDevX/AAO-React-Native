import Foundation

/// One schedule of a bus line as a timetable: its stops across, one row per
/// trip, each a time at each stop or nil where the trip skips it (`false` in
/// the file). The edits it builds are at `base`, the schedule's path.
public struct BusSchedule: Equatable, Sendable {
    public let stops: [String]
    public let trips: [[ClockTime?]]
    /// each stop's coordinates, by its name
    public let coordinates: [String: JSONValue]

    public init(_ schedule: JSONValue) {
        stops = schedule["stops"]?.array?.compactMap(\.string) ?? []
        trips = (schedule["times"]?.array ?? []).map { row in (row.array ?? []).map { $0.string.flatMap(ClockTime.init) } }
        if case .object(let object)? = schedule["coordinates"] { coordinates = object } else { coordinates = [:] }
    }

    private static func json(_ time: ClockTime?) -> JSONValue { time.map { .string($0.text) } ?? .bool(false) }

    private static func row(_ trip: [ClockTime?]) -> JSONValue { .array(trip.map(json)) }

    /// Sets trip `trip`'s time at stop `stop`, or marks the stop skipped when `time` is nil.
    public func setTime(trip: Int, stop: Int, _ time: ClockTime?, at base: [PathKey]) -> [EditOp] {
        [.set(base + ["times", .index(trip), .index(stop)], Self.json(time))]
    }

    /// A trip after the last: the last again, as far after it as it is after
    /// the one before, which is another run of the same loop. After a single
    /// trip, a copy of it; in an empty timetable, a trip that skips every stop.
    public func addTrip(at base: [PathKey]) -> [EditOp] {
        let next: [ClockTime?]
        if let last = trips.last {
            let gap = trips.count < 2 ? 0 : zip(trips[trips.count - 2], last).lazy
                .compactMap { before, after in before.flatMap { b in after.map { $0.minutes - b.minutes } } }.first ?? 0
            next = last.map { $0.map { ClockTime(minutes: (($0.minutes + gap) % 1440 + 1440) % 1440) } }
        } else {
            next = Array(repeating: nil, count: stops.count)
        }
        return [.set(base + ["times", .index(trips.count)], Self.row(next))]
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
            + trips.enumerated().map { trip, times in
                var row = times
                row.insert(nil, at: min(index, row.count))
                return .set(base + ["times", .index(trip)], Self.row(row))
            }
    }

    /// The stops, and every trip, without the stop at `index`.
    public func removeStop(at index: Int, at base: [PathKey]) -> [EditOp] {
        var names = stops
        names.remove(at: index)
        return [.set(base + ["stops"], .array(names.map(JSONValue.string)))]
            + trips.enumerated().map { trip, times in
                var row = times
                if row.indices.contains(index) { row.remove(at: index) }
                return .set(base + ["times", .index(trip)], Self.row(row))
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
