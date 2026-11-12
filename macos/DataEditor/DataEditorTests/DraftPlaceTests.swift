import DataEditorKit
import Testing
@testable import DataEditor

/// Where a title or notes draft is saved once its file changed while it was typed.
@MainActor
struct DraftPlaceTests {
    private func schedule(_ title: String, opens: String) -> JSONValue {
        .object(["title": .string(title), "hours": .array([.object(["from": .string(opens)])])])
    }

    private func file(_ schedules: JSONValue...) -> JSONValue { .object(["schedule": .array(schedules)]) }

    private let titleOfFirst: [PathKey] = [.key("schedule"), .index(0), .key("title")]
    private let hours = JSONValue.object(["title": .string("Hours"), "hours": .array([.object(["from": .string("7:30am")])])])

    @Test func aScheduleStillInItsPlaceTakesTheDraft() {
        let current = file(schedule("Hours", opens: "7:30am"), schedule("Breakfast", opens: "9:00am"))
        #expect(AppModel.draftPath(titleOfFirst, schedule: hours, in: current) == titleOfFirst)
    }

    @Test func aScheduleWhoseOwnTitleChangedStillTakesTheDraft() {
        let current = file(schedule("Open", opens: "7:30am"))
        #expect(AppModel.draftPath(titleOfFirst, schedule: hours, in: current) == titleOfFirst)
    }

    @Test func aScheduleThatMovedTakesTheDraftInItsNewPlace() {
        let current = file(schedule("Breakfast", opens: "9:00am"), schedule("Hours", opens: "7:30am"))
        #expect(AppModel.draftPath(titleOfFirst, schedule: hours, in: current) == [.key("schedule"), .index(1), .key("title")])
    }

    @Test func aScheduleThatChangedElsewhereIsNotFound() {
        let current = file(schedule("Hours", opens: "8:00am"))
        #expect(AppModel.draftPath(titleOfFirst, schedule: hours, in: current) == nil)
    }

    @Test func aScheduleThatIsGoneIsNotFound() {
        let current = file(schedule("Breakfast", opens: "9:00am"))
        #expect(AppModel.draftPath(titleOfFirst, schedule: hours, in: current) == nil)
    }

    @Test func twoSchedulesThatBothMatchAreNotGuessedBetween() {
        let current = file(schedule("Hours", opens: "7:30am"), schedule("Open", opens: "7:30am"))
        #expect(AppModel.draftPath(titleOfFirst, schedule: hours, in: current) == nil)
    }

    @Test func notesNotYetWrittenAreFoundTheSameWay() {
        let notes: [PathKey] = [.key("schedule"), .index(0), .key("notes")]
        let current = file(schedule("Breakfast", opens: "9:00am"), schedule("Hours", opens: "7:30am"))
        #expect(AppModel.draftPath(notes, schedule: hours, in: current) == [.key("schedule"), .index(1), .key("notes")])
    }
}
