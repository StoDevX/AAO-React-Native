import XCTest

/// A bus line's timetable as a grid: its stops across, a row per trip.
@MainActor
final class BusTimetableUITests: XCTestCase {
    private let express = "bus-times:bus-times/1-express.yaml"

    private func waitFor(_ text: String, or other: String? = nil, in data: URL) -> Bool {
        let deadline = Date().addingTimeInterval(10)
        while Date() < deadline {
            if let held = try? String(contentsOf: data.appending(path: "bus-times/1-express.yaml"), encoding: .utf8),
               held.contains(text) || other.map(held.contains) == true { return true }
            RunLoop.current.run(until: Date().addingTimeInterval(0.2))
        }
        return false
    }

    func testATimeIsSetInItsCell() throws {
        let (app, data) = try launchWithRepoData(opening: express)
        let window = currentChanges(in: app)
        let cell = window.datePickers["timetable-1-cell-0-1"]
        XCTAssertTrue(cell.waitForExistence(timeout: 10))
        attachScreenshot(of: window, named: "The Express's timetable")
        cell.coordinate(withNormalizedOffset: CGVector(dx: 0.15, dy: 0.5)).click()
        cell.typeKey(.upArrow, modifierFlags: [])
        cell.typeKey(.return, modifierFlags: [])
        XCTAssertTrue(waitFor("3:00pm, 4:08pm,", or: "3:00pm, '4:08pm',", in: data))
    }

    func testAStopATripSkipsIsMarkedFromItsCell() throws {
        let (app, data) = try launchWithRepoData(opening: express)
        let window = currentChanges(in: app)
        let cell = window.datePickers["timetable-1-cell-0-1"]
        XCTAssertTrue(cell.waitForExistence(timeout: 10))
        cell.rightClick()
        app.menuItems["Doesn't Stop Here"].click()
        XCTAssertTrue(waitFor("3:00pm, false,", in: data))
        XCTAssertTrue(window.staticTexts["timetable-1-skipped-0-1"].waitForExistence(timeout: 5))
    }

    /// Another run of the loop: the Express runs hourly, so the next trip leaves at 10pm.
    func testAddTripRunsTheLoopAgain() throws {
        let (app, data) = try launchWithRepoData(opening: express)
        let window = currentChanges(in: app)
        let add = window.buttons["timetable-1-add-trip"]
        XCTAssertTrue(add.waitForExistence(timeout: 10))
        add.click()
        XCTAssertTrue(waitFor("- [10:00pm, 10:08pm", or: "- ['10:00pm', '10:08pm'", in: data))
    }

    func testRenamingAStopRenamesItsCoordinates() throws {
        let (app, data) = try launchWithRepoData(opening: express)
        let window = currentChanges(in: app)
        let stop = window.textFields["timetable-1-stop-1"]
        XCTAssertTrue(stop.waitForExistence(timeout: 10))
        stop.click()
        stop.typeKey("a", modifierFlags: .command)
        stop.typeText("Rolvaag Library\r")
        XCTAssertTrue(waitFor("Rolvaag Library: [", in: data))
    }

    func testATimeBeforeTheStopBeforeItIsFlagged() throws {
        let (app, data) = try launchWithRepoData(opening: express)
        let file = data.appending(path: "bus-times/1-express.yaml")
        let text = try String(contentsOf: file, encoding: .utf8)
        try text.replacingOccurrences(of: "[3:00pm, 3:08pm, 3:12pm", with: "[3:00pm, 3:08pm, 2:12pm").write(to: file, atomically: true, encoding: .utf8)
        let window = currentChanges(in: app)
        // the record was open before the file changed; choosing it again reads it afresh
        window.outlines["record-list"].staticTexts["Oles Go"].click()
        window.outlines["record-list"].staticTexts["Express Bus"].click()
        XCTAssertTrue(window.images["timetable-1-flag-0-2"].waitForExistence(timeout: 10))
    }

    /// A schedule's days are one control, a segment a day.
    func testAScheduleDaysAreOneControl() throws {
        let (app, data) = try launchWithRepoData(opening: express)
        let window = currentChanges(in: app)
        // AppKit's select-any segmented control shows each segment as a checkbox
        let days = window.groups["timetable-1-days"]
        XCTAssertTrue(days.waitForExistence(timeout: 10))
        days.checkBoxes["Sun"].click()
        XCTAssertTrue(waitFor("- Su\n", in: data))
    }

    /// A new line starts with neither colours nor schedules, and the form offers both.
    func testANewLineGetsItsColoursAndASchedule() throws {
        let (app, data) = try launchWithRepoData(opening: "bus-times")
        let window = currentChanges(in: app)
        let new = window.buttons["new-record"]
        XCTAssertTrue(new.waitForExistence(timeout: 10))
        new.click()
        let title = app.textFields["new-record-title"]
        XCTAssertTrue(title.waitForExistence(timeout: 5))
        title.click()
        title.typeText("Night Owl")
        app.buttons["new-record-add"].click()
        let schedule = window.buttons["timetable-add-schedule"]
        XCTAssertTrue(schedule.waitForExistence(timeout: 10))
        schedule.click()
        let colour = window.buttons["add-colour-field-colors.bar"]
        XCTAssertTrue(colour.waitForExistence(timeout: 10))
        colour.click()
        attachScreenshot(of: window, named: "A new bus line with a schedule and a colour")
        let deadline = Date().addingTimeInterval(10)
        var text = ""
        while Date() < deadline {
            let folder = data.appending(path: "bus-times")
            let files = (try? FileManager.default.contentsOfDirectory(atPath: folder.path)) ?? []
            if let file = files.first(where: { $0.contains("night-owl") }) {
                text = (try? String(contentsOf: folder.appending(path: file), encoding: .utf8)) ?? ""
                if text.contains("schedules:"), text.contains("bar: rgb(") { break }
            }
            RunLoop.current.run(until: Date().addingTimeInterval(0.2))
        }
        XCTAssertTrue(text.contains("schedules:") && text.contains("bar: rgb("), text)
    }

    /// A stop is added where it goes on the route, not only at the end.
    func testAStopIsAddedAfterAnother() throws {
        let (app, data) = try launchWithRepoData(opening: express)
        let window = currentChanges(in: app)
        let insert = window.buttons["timetable-1-stop-insert-0"]
        XCTAssertTrue(insert.waitForExistence(timeout: 10))
        insert.click()
        XCTAssertTrue(waitFor("      - St. Olaf College\n      - New Stop\n      - Library\n", in: data))
        // the new stop's name is ready to type over
        app.typeText("Northfield Depot\r")
        XCTAssertTrue(waitFor("      - St. Olaf College\n      - Northfield Depot\n      - Library\n", in: data))
    }

    func testAGeneratedLinesTimetableIsLocked() throws {
        let app = try launchWithRepoData(opening: "bus-times:bus-times/3-red-line.yaml").app
        let window = currentChanges(in: app)
        XCTAssertTrue(window.staticTexts["Generated weekly from the Hiawathaland GTFS feed; Bus Curation sets their notice and colours"].waitForExistence(timeout: 10))
        let add = window.buttons["timetable-1-add-trip"]
        XCTAssertTrue(add.waitForExistence(timeout: 10))
        XCTAssertFalse(add.isEnabled)
        // nor does a cell's menu open
        window.datePickers["timetable-1-cell-0-0"].rightClick()
        XCTAssertFalse(app.menuItems["Doesn't Stop Here"].waitForExistence(timeout: 2))
    }
}
