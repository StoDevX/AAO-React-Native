import Foundation
import Testing
@testable import DataEditorKit

/// A break calendar shaped as `data/breaks.yaml`, its breaks out of date order as a dictionary may hold them.
private func calendar() throws -> BreaksDocument {
    let json = """
        {"timezone": "America/Chicago",
         "templates": {"library-fall-closed": [{"title": "Fall Break", "isPhysicallyOpen": false, "hours": [], "notes": "Closed for Fall Break"}]},
         "breaks": {"spring": {"name": "Spring Break", "start": "2027-03-26", "end": "2027-04-04"},
                    "fall": {"name": "Fall Break", "start": "2026-10-10", "end": "2026-10-13"},
                    "easter": {"name": "Easter", "date": "2027-03-28"}}}
        """
    return BreaksDocument(value: try JSONDecoder().decode(JSONValue.self, from: Data(json.utf8)))
}

struct BreaksDocumentTests {
    /// A one-day break's date counts as its start.
    @Test func listsBreaksByWhenTheyStart() throws {
        #expect(try calendar().breaks.map(\.key) == ["fall", "spring", "easter"])
    }

    @Test func readsFallBreak() throws {
        let fall = try #require(try calendar().breaks.first { $0.key == "fall" })
        #expect(fall.name == "Fall Break")
        #expect(fall.start == "2026-10-10")
        #expect(fall.end == "2026-10-13")
        #expect(fall.date == nil)
    }

    @Test func readsAOneDayBreakByItsDate() throws {
        let easter = try #require(try calendar().breaks.first { $0.key == "easter" })
        #expect(easter.date == "2027-03-28")
        #expect(easter.start == nil)
    }

    @Test func setDatesWritesBothEnds() throws {
        #expect(try calendar().setDates(key: "fall", start: "2026-10-09", end: "2026-10-14")
            == [.set(["breaks", "fall", "start"], .string("2026-10-09")), .set(["breaks", "fall", "end"], .string("2026-10-14"))])
    }

    @Test func addBreakNamesItAndLeavesItsDatesToFill() throws {
        #expect(try calendar().addBreak(key: "summer", name: "Summer Break")
            == .set(["breaks", "summer"], .object(["name": .string("Summer Break")])))
    }

    @Test func removeBreakDeletesItsKey() throws {
        #expect(try calendar().removeBreak(key: "fall") == .delete(["breaks", "fall"]))
    }

    @Test func listsTheClosureTemplates() throws {
        #expect(try calendar().templates == ["library-fall-closed"])
    }
}
