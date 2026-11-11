import DataEditorKit
import Foundation
import Testing
@testable import DataEditor

@MainActor
struct ProblemWordingTests {
    private let cage = "building-hours/1-1-cage.yaml"

    private func problem(_ message: String, _ path: [PathKey]?, file: String? = "building-hours/1-1-cage.yaml") -> Problem {
        Problem(file: file, message: message, path: path)
    }

    /// The message each problem reads as, in order.
    private func plain(_ problems: Problem...) -> [String] {
        plainProblems(problems).map(\.message)
    }

    private let buildings = try! JSONDecoder().decode([BuildingSummary].self, from: Data("""
        [{"file": "building-hours/1-1-cage.yaml", "name": "The Cage", "category": "Food"},
         {"file": "building-hours/1-3-stav.yaml", "name": "Stav Hall", "category": "Food"}]
        """.utf8))

    @Test func saysAnEmptyTitleOrNoteCannotBeEmpty() {
        #expect(plain(problem(#"must match pattern "\S""#, ["schedule", 0, "title"])) == ["The title can't be empty."])
        #expect(plain(problem(#"must match pattern "\S""#, ["schedule", 0, "notes"])) == ["The note can't be empty."])
    }

    @Test func asksForATimeOrADateItCanRead() {
        let time = #"must match pattern "^(?:[1-9]|1[0-2]):[0-5]\d[ap]m$""#
        #expect(plain(problem(time, ["schedule", 0, "hours", 0, "from"])) == ["The opening time must be a time like 9:00am."])
        #expect(plain(problem(time, ["schedule", 0, "hours", 0, "to"])) == ["The closing time must be a time like 9:00am."])
        #expect(plain(problem(#"must match format "date""#, ["exceptions", 0, "date"])) == ["The date must be a day like 2026-11-10."])
    }

    @Test func namesWhatIsMissing() {
        #expect(plain(problem("must have required property 'title'", ["schedule", 0])) == ["Needs a title."])
        #expect(plain(problem("must have required property 'from'", ["schedule", 0, "hours", 0])) == ["Needs an opening time."])
        #expect(plain(problem("must have required property 'to'", ["schedule", 0, "hours", 0])) == ["Needs a closing time."])
        #expect(plain(problem("must have required property 'days'", ["schedule", 0, "hours", 0])) == ["Needs at least one day."])
        #expect(plain(problem("must NOT have fewer than 1 items", ["schedule", 0, "hours", 0, "days"])) == ["Needs at least one day."])
        #expect(plain(problem("must NOT have fewer than 1 items", ["schedule"])) == ["Needs at least one service."])
        #expect(plain(problem("a schedule must contain at least one service", ["schedule"])) == ["Needs at least one service."])
        #expect(plain(problem("must NOT have duplicate items (items ## 1 and 0 are identical)", ["schedule", 0, "hours", 0, "days"])) == ["Names the same day twice."])
    }

    /// The schema allows a service no hours only if it is closed or says why,
    /// and reports each way it fell short; they are one problem to fix.
    @Test func joinsTheReasonsAServiceHasNoHoursIntoOne() {
        let service: [PathKey] = ["schedule", 1]
        #expect(plain(
            problem("must NOT have fewer than 1 items", service + ["hours"]),
            problem("must have required property 'isPhysicallyOpen'", service),
            problem("must have required property 'notes'", service),
            problem("must match a schema in anyOf", service),
        ) == ["Has no hours. Add hours, turn on Closed, or add a note such as “By appointment”."])
    }

    @Test func wordsTheScheduleChecks() {
        #expect(plain(problem("duplicate exception date 2026-11-10", ["exceptions", 1])) == ["Another exception is already on 2026-11-10."])
        #expect(plain(problem("break closure messages must not end with a period", ["breakSchedule", "fall", "schedule", 0, "notes"]))
            == ["Take the period off the end of this note."])
    }

    @Test func keepsAMessageItCannotWordAsItIs() {
        #expect(plain(problem("must NOT have additional properties", ["schedule", 0])) == ["must NOT have additional properties"])
        #expect(plain(problem("The build did not run", nil, file: nil)) == ["The build did not run"])
    }

    @Test func listsAProblemReportedTwiceOnce() {
        let title = problem(#"must match pattern "\S""#, ["schedule", 0, "title"])
        #expect(plainProblems([title, title]).count == 1)
    }

    @Test func wordsThePlaceInTheFile() {
        #expect(plainPlace(["schedule", 0, "title"]) == "Usual hours › service 1 › title")
        #expect(plainPlace(["schedule", 1, "hours", 0, "to"]) == "Usual hours › service 2 › row 1 › closing time")
        #expect(plainPlace(["exceptions", 2, "date"]) == "Exception 3 › date")
        #expect(plainPlace(["exceptions", 0, "schedule", 0, "notes"]) == "Exception 1 › service 1 › note")
        #expect(plainPlace(["breakSchedule", "fall", "schedule", 0, "notes"], breakNames: ["fall": "Fall Break"]) == "Fall Break › service 1 › note")
        #expect(plainPlace(["breakSchedule", "fall", 0, "title"]) == "fall › service 1 › title")
    }

    @Test func namesAFileByItsBuilding() {
        #expect(buildingName(of: cage, in: buildings) == "The Cage")
        #expect(buildingName(of: "breaks.yaml", in: buildings) == "breaks.yaml")
    }

    /// A problem from the file on screen needs no name; one from another file
    /// would send the contributor to the wrong building without it.
    @Test func namesTheBuildingOfAProblemFromAnotherFile() {
        let title = problem("The title can't be empty.", ["schedule", 0, "title"])
        #expect(problemLine(title, fileOnScreen: cage, buildings: buildings) == "The title can't be empty.")
        #expect(problemLine(title, fileOnScreen: "building-hours/1-3-stav.yaml", buildings: buildings) == "The Cage: The title can't be empty.")
        #expect(problemLine(title, fileOnScreen: nil, buildings: buildings) == "The Cage: The title can't be empty.")
        let other = problem("Needs a title.", nil, file: "building-hours/9-9-new.yaml")
        #expect(problemLine(other, fileOnScreen: nil, buildings: buildings) == "building-hours/9-9-new.yaml: Needs a title.")
        let unplaced = problem("The build did not run", nil, file: nil)
        #expect(problemLine(unplaced, fileOnScreen: nil, buildings: buildings) == "The build did not run")
    }
}
