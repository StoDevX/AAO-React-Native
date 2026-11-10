import Foundation
import Testing
@testable import DataEditorKit

private let cage: JSONValue = .object([
    "name": .string("The Cage"),
    "category": .string("Food"),
    "schedule": .array([
        .object([
            "title": .string("Hours"),
            "notes": .string("The kitchen stops cooking at 8 p.m."),
            "hours": .array([
                .object(["days": .array([.string("Mo"), .string("Tu")]), "from": .string("7:30am"), "to": .string("8:00pm")]),
                .object(["days": .array([.string("Fr")]), "from": .string("8:00pm"), "to": .string("2:00am")]),
            ]),
        ]),
    ]),
    "exceptions": .array([
        .object(["date": .string("2026-11-26"), "schedule": .array([.object(["title": .string("Hours"), "isPhysicallyOpen": .bool(false), "hours": .array([])])])]),
    ]),
    "breakSchedule": .object(["fall": .string("library-fall-closed")]),
])

struct ClockTimeTests {
    @Test(arguments: [("12:00am", 0), ("12:30pm", 750), ("7:30am", 450), ("11:59pm", 1439)])
    func readsTimes(text: String, minutes: Int) {
        #expect(ClockTime(text)?.minutes == minutes)
        #expect(ClockTime(minutes: minutes).text == text)
    }

    @Test(arguments: ["7:30", "13:00pm", "0:30am", "7:3am", ""])
    func rejectsMalformedTimes(text: String) {
        #expect(ClockTime(text) == nil)
    }

    @Test func offersEveryQuarterHour() {
        #expect(ClockTime.quarterHours.count == 96)
        #expect(ClockTime.quarterHours.first?.text == "12:00am")
    }
}

struct HoursDocumentTests {
    @Test func readsTheSchedule() {
        let document = HoursDocument(value: cage)
        #expect(document.name == "The Cage")
        #expect(document.services.first?.rows.first?.days == [.Mo, .Tu])
        #expect(document.exceptions.first?.date == "2026-11-26")
        #expect(document.exceptions.first?.services.first?.isPhysicallyOpen == false)
        #expect(document.breakSchedule["fall"] == .template("library-fall-closed"))
    }

    @Test func splitsARowThatClosesAfterMidnight() {
        let row = HoursDocument(value: cage).services[0].rows[1]
        #expect(row.segments() == [
            HoursRow.Segment(day: .Fr, start: 1200, end: 1440),
            HoursRow.Segment(day: .Sa, start: 0, end: 120),
        ])
    }

    /// The app moves a close to the next day only when it is before the open,
    /// so a close equal to the open is a window of no length: closed.
    @Test(arguments: ["12:00am", "8:00am"])
    func drawsNothingWhenTheCloseIsTheOpen(time: String) {
        #expect(HoursRow(days: [.Su], fromText: time, toText: time).segments() == [])
    }

    @Test func endsAtMidnightWhenTheCloseIsMidnight() {
        let row = HoursRow(days: [.Fr], fromText: "8:00pm", toText: "12:00am")
        #expect(row.segments() == [HoursRow.Segment(day: .Fr, start: 1200, end: 1440)])
    }

    @Test func wrapsSundayIntoMonday() {
        let row = HoursRow(days: [.Su], fromText: "10:00pm", toText: "1:00am")
        #expect(row.segments().last == HoursRow.Segment(day: .Mo, start: 0, end: 60))
    }

    @Test func editsAtTheSchedulesPath() {
        let editor = ScheduleEditor(base: ["exceptions", 0, "schedule"], services: HoursDocument(value: cage).exceptions[0].services)
        #expect(editor.setTime(service: 0, row: 1, end: .to, ClockTime(minutes: 600)) ==
            .set(["exceptions", 0, "schedule", 0, "hours", 1, "to"], .string("10:00am")))
        #expect(editor.addRow(service: 0) == .set(
            ["exceptions", 0, "schedule", 0, "hours", 0],
            .object(["days": .array(["Mo", "Tu", "We", "Th", "Fr"].map(JSONValue.string)), "from": .string("9:00am"), "to": .string("5:00pm")])
        ))
        #expect(editor.setNotes(service: 0, nil) == .delete(["exceptions", 0, "schedule", 0, "notes"]))
        #expect(editor.setDays(service: 0, row: 0, [.We, .Mo]) == .set(["exceptions", 0, "schedule", 0, "hours", 0, "days"], .array([.string("Mo"), .string("We")])))
    }

    @Test func appendsRowsAndServicesAfterTheLastOne() {
        let editor = ScheduleEditor(base: ["schedule"], services: HoursDocument(value: cage).services)
        #expect(editor.addRow(service: 0) == .set(
            ["schedule", 0, "hours", 2],
            .object(["days": .array(["Mo", "Tu", "We", "Th", "Fr"].map(JSONValue.string)), "from": .string("9:00am"), "to": .string("5:00pm")])
        ))
        #expect(editor.addService(title: "Grill") == .set(["schedule", 1], .object([
            "title": .string("Grill"),
            "hours": .array([.object(["days": .array([.string("Mo")]), "from": .string("9:00am"), "to": .string("5:00pm")])]),
        ])))
    }

    @Test func removesARowAndRenamesAService() {
        let editor = ScheduleEditor(base: ["schedule"], services: HoursDocument(value: cage).services)
        #expect(editor.removeRow(service: 0, row: 1) == .delete(["schedule", 0, "hours", 1]))
        #expect(editor.setTitle(service: 0, "Grill") == .set(["schedule", 0, "title"], .string("Grill")))
    }

    @Test func marksAServiceClosedAndOpenAgain() {
        let editor = ScheduleEditor(base: ["exceptions", 0, "schedule"], services: HoursDocument(value: cage).exceptions[0].services)
        #expect(editor.setClosed(service: 0, true) == [
            .set(["exceptions", 0, "schedule", 0, "hours"], .array([])),
            .set(["exceptions", 0, "schedule", 0, "isPhysicallyOpen"], .bool(false)),
        ])
        #expect(editor.setClosed(service: 0, false) == [
            .delete(["exceptions", 0, "schedule", 0, "isPhysicallyOpen"]),
            .set(["exceptions", 0, "schedule", 0, "hours", 0],
                 .object(["days": .array(["Mo", "Tu", "We", "Th", "Fr"].map(JSONValue.string)), "from": .string("9:00am"), "to": .string("5:00pm")])),
        ])
    }

    @Test func refusesToRemoveTheLastService() {
        let editor = ScheduleEditor(base: ["schedule"], services: HoursDocument(value: cage).services)
        #expect(editor.removeService(0) == nil)
    }
}
