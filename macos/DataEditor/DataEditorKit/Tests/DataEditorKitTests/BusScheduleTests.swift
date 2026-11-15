import Foundation
import Testing
@testable import DataEditorKit

/// The Express's first schedule, cut to four stops and two trips, as the helper sends it.
private let express = try! JSONDecoder().decode(JSONValue.self, from: Data(#"""
    {"days": ["Mo", "Tu"],
     "coordinates": {"St. Olaf College": [44.46, -93.18], "Library": [44.45, -93.15], "Carleton College": [44.46, -93.15]},
     "stops": ["St. Olaf College", "Library", "Carleton College", "St. Olaf College"],
     "times": [["3:00pm", "3:08pm", false, "3:50pm"], ["3:40pm", "3:48pm", "3:52pm", "4:30pm"]]}
    """#.utf8))

private let base: [PathKey] = ["schedules", 0]

struct BusScheduleTests {
    private let schedule = BusSchedule(express)

    @Test func readsStopsAndTripsWithStopsSkipped() {
        #expect(schedule.stops == ["St. Olaf College", "Library", "Carleton College", "St. Olaf College"])
        #expect(schedule.trips[0][2] == nil)
        #expect(schedule.trips[1][2] == ClockTime("3:52pm"))
    }

    @Test func setsATimeOrSkipsTheStop() {
        #expect(schedule.setTime(trip: 0, stop: 1, ClockTime("3:09pm"), at: base) == [.set(base + ["times", 0, 1], .string("3:09pm"))])
        #expect(schedule.setTime(trip: 0, stop: 1, nil, at: base) == [.set(base + ["times", 0, 1], .bool(false))])
    }

    /// Another run of the same loop: the last trip, as far after it as it is after the one before.
    @Test func addsATripShiftedByTheLastGap() {
        #expect(schedule.addTrip(at: base) == [.set(base + ["times", 2], .array([
            .string("4:20pm"), .string("4:28pm"), .string("4:32pm"), .string("5:10pm"),
        ]))])
    }

    @Test func aFirstTripAfterOneCopiesIt() {
        let one = BusSchedule(.object(["stops": .array([.string("A")]), "times": .array([.array([.string("9:00am")])])]))
        #expect(one.addTrip(at: base) == [.set(base + ["times", 1], .array([.string("9:00am")]))])
    }

    @Test func removesTripsFromTheEndFirst() {
        #expect(schedule.removeTrips([0, 1], at: base) == [.delete(base + ["times", 1]), .delete(base + ["times", 0])])
    }

    /// A new stop is skipped by every trip until its times are filled in.
    @Test func insertingAStopKeepsEveryTripInStep() {
        let ops = schedule.insertStop("Food Co-op", at: 2, at: base)
        #expect(ops.first == .set(base + ["stops"], .array(["St. Olaf College", "Library", "Food Co-op", "Carleton College", "St. Olaf College"].map(JSONValue.string))))
        #expect(ops.contains(.set(base + ["times", 0], .array([.string("3:00pm"), .string("3:08pm"), .bool(false), .bool(false), .string("3:50pm")]))))
        #expect(ops.count == 3)
    }

    @Test func removingAStopRemovesItsColumn() {
        let ops = schedule.removeStop(at: 1, at: base)
        #expect(ops.contains(.set(base + ["times", 1], .array([.string("3:40pm"), .string("3:52pm"), .string("4:30pm")]))))
    }

    /// A time the grid can't read, which the schema allows, is kept as written when every row is rewritten.
    @Test func keepsATimeItCannotReadAsWritten() {
        let odd = BusSchedule(.object(["stops": .array([.string("A"), .string("B")]),
                                       "times": .array([.array([.string("3:8pm"), .string("3:10pm")])])]))
        #expect(odd.unreadable == [[0, 0]])
        #expect(odd.insertStop("C", at: 2, at: base).contains(.set(base + ["times", 0], .array([.string("3:8pm"), .string("3:10pm"), .bool(false)]))))
    }

    @Test func insertsAStopAfterAnother() {
        let ops = schedule.insertStop("Food Co-op", at: 1, at: base)
        #expect(ops.first == .set(base + ["stops"], .array(["St. Olaf College", "Food Co-op", "Library", "Carleton College", "St. Olaf College"].map(JSONValue.string))))
    }

    /// A stop moves with its column of times.
    @Test func movesAStopWithItsTimes() {
        let ops = schedule.moveStop(from: 1, to: 2, at: base)
        #expect(ops.first == .set(base + ["stops"], .array(["St. Olaf College", "Carleton College", "Library", "St. Olaf College"].map(JSONValue.string))))
        #expect(ops.contains(.set(base + ["times", 1], .array([.string("3:40pm"), .string("3:52pm"), .string("3:48pm"), .string("4:30pm")]))))
    }

    @Test func renamingAStopRenamesItsCoordinates() {
        #expect(schedule.renameStop(at: 1, to: "Rolvaag Library", at: base) == [
            .set(base + ["stops", 1], .string("Rolvaag Library")),
            .delete(base + ["coordinates", "Library"]),
            .set(base + ["coordinates", "Rolvaag Library"], .array([.number(44.45), .number(-93.15)])),
        ])
    }

    /// The Express starts and ends at St. Olaf: renaming one end leaves the coordinates the other still names.
    @Test func renamingOneOfARepeatedStopKeepsItsCoordinates() {
        #expect(schedule.renameStop(at: 3, to: "St. Olaf (return)", at: base) == [.set(base + ["stops", 3], .string("St. Olaf (return)"))])
    }

    @Test func findsATimeEarlierThanTheStopBeforeIt() {
        let late = BusSchedule(.object(["stops": .array([.string("A"), .string("B"), .string("C")]),
                                        "times": .array([.array([.string("3:00pm"), .bool(false), .string("2:50pm")])])]))
        #expect(late.outOfOrder().map { [$0.trip, $0.stop] } == [[0, 2]])
        #expect(schedule.outOfOrder().isEmpty)
    }
}
