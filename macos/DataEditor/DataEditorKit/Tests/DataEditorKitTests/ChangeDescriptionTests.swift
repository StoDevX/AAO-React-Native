import Testing
@testable import DataEditorKit

private func row(_ days: [String], _ from: String, _ to: String) -> JSONValue {
    .object(["days": .array(days.map(JSONValue.string)), "from": .string(from), "to": .string(to)])
}

private func service(_ title: String, notes: String? = nil, _ rows: [JSONValue]) -> JSONValue {
    var fields: [String: JSONValue] = ["title": .string(title), "hours": .array(rows)]
    if let notes { fields["notes"] = .string(notes) }
    return .object(fields)
}

private func building(_ schedule: [JSONValue], extra: [String: JSONValue] = [:]) -> HoursDocument {
    HoursDocument(value: .object(["name": .string("The Cage"), "schedule": .array(schedule)].merging(extra) { $1 }))
}

private let weekdays = ["Mo", "Tu", "We", "Th", "Fr"]

/// The model phrases these, so they say plainly what changed: a small model
/// reading YAML lines guessed at times and copied its example instead.
struct ChangeDescriptionTests {
    @Test func describesNewHoursAndARemovedNote() {
        let before = building([service("Hours", notes: "The kitchen stops cooking at 8 p.m.",
                                       [row(weekdays, "7:30am", "8:00pm"), row(["Sa", "Su"], "9:00am", "8:00pm")])])
        let after = building([service("Hours", [row(weekdays, "9:00am", "5:00pm")])])
        #expect(describeChange(from: before, to: after) == [
            "Hours: Mon–Fri 7:30am–8pm; Sat–Sun 9am–8pm → Mon–Fri 9am–5pm",
            "Hours: note removed",
        ])
    }

    @Test func namesTheDaysOfABrokenRun() {
        let before = building([service("Hours", [row(["Mo", "We", "Fr"], "11:00am", "1:00pm")])])
        let after = building([service("Hours", [row(["Mo", "Tu", "We", "Fr"], "11:00am", "1:00pm")])])
        #expect(describeChange(from: before, to: after) == ["Hours: Mon, Wed, Fri 11am–1pm → Mon–Wed, Fri 11am–1pm"])
    }

    @Test func describesAServiceAddedRemovedAndRenamed() {
        let before = building([service("Hours", [row(weekdays, "9:00am", "5:00pm")]), service("Grill", [row(["Mo"], "11:00am", "2:00pm")]),
                               service("Snacks", [])])
        let after = building([service("Open", [row(weekdays, "9:00am", "5:00pm")]), service("Brunch", notes: "Sundays only", [row(["Su"], "10:00am", "1:00pm")])])
        #expect(describeChange(from: before, to: after) == [
            "Hours renamed to Open",
            "Grill renamed to Brunch",
            "Brunch: Mon 11am–2pm → Sun 10am–1pm",
            "Brunch: note added: \"Sundays only\"",
            "Snacks removed",
        ])
        #expect(describeChange(from: after, to: before).last == "Snacks added: closed")
    }

    @Test func describesExceptionsByDate() {
        let hours = service("Hours", [row(weekdays, "9:00am", "5:00pm")])
        let before = building([hours], extra: ["exceptions": .array([
            .object(["date": .string("2026-11-26"), "schedule": .array([service("Hours", [])])]),
            .object(["date": .string("2026-12-24"), "schedule": .array([service("Hours", [row(["We"], "9:00am", "1:00pm")])])]),
        ])])
        let after = building([hours], extra: ["exceptions": .array([
            .object(["date": .string("2026-12-24"), "schedule": .array([service("Hours", [row(["We"], "9:00am", "12:00pm")])])]),
            .object(["date": .string("2026-12-31"), "schedule": .array([service("Hours", [])])]),
        ])])
        #expect(describeChange(from: before, to: after) == [
            "Removed the exception on 2026-11-26",
            "Hours on 2026-12-24: Wed 9am–1pm → Wed 9am–12pm",
            "Added an exception on 2026-12-31: Hours closed",
        ])
    }

    @Test func describesBreakSchedules() {
        let hours = service("Hours", [row(weekdays, "9:00am", "5:00pm")])
        let before = building([hours], extra: ["breakSchedule": .object(["fall": .string("closed"), "winter": .string("normal")])])
        let after = building([hours], extra: ["breakSchedule": .object([
            "fall": .array([service("Hours", [row(["Mo"], "10:00am", "2:00pm")])]),
            "spring": .string("closed"),
        ])])
        #expect(describeChange(from: before, to: after) == [
            "During fall: the closed template → Hours Mon 10am–2pm",
            "During spring: the closed template",
            "During winter: no longer set",
        ])
    }

    @Test func namesOtherFieldsThatChanged() {
        let hours = service("Hours", [row(weekdays, "9:00am", "5:00pm")])
        let before = building([hours], extra: ["links": .array([])])
        let after = building([hours], extra: ["links": .array([.object(["title": .string("Menu")])]), "name": .string("The Cage Grill")])
        #expect(describeChange(from: before, to: after) == ["Renamed to The Cage Grill", "Changed its links"])
    }

    @Test func describesANewBuilding() {
        let after = building([service("Hours", [row(weekdays, "9:00am", "5:00pm")])])
        #expect(describeChange(from: nil, to: after) == ["New building: Hours Mon–Fri 9am–5pm"])
    }
}
