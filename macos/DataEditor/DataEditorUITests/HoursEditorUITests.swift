import XCTest

@MainActor
final class HoursEditorUITests: XCTestCase {
    /// The running app's data folder, for a test that changes a file under it.
    private var data: URL?

    /// Launches on the repo's data, keeping its data folder in `data`.
    private func launch(conflicted: String? = nil, opening: String? = nil) throws -> XCUIApplication {
        let launched = try launchWithRepoData(conflicted: conflicted, opening: opening)
        data = launched.data
        return launched.app
    }

    /// A hand edit to The Cage's usual hours would be reverted by the Bon Appétit scrape, so they read only.
    func testTheCagesUsualHoursFollowTheScrape() throws {
        let app = try launchWithRepoData(keepsScrapes: true, opening: theCage).app
        let window = currentChanges(in: app)
        XCTAssertTrue(window.descendants(matching: .any)["scraped-lock"].firstMatch.waitForExistence(timeout: 10))
        XCTAssertFalse(window.textFields["service-title-0"].isEnabled)
        attachScreenshot(of: window, named: "The Cage's usual hours, kept by the scrape")
    }

    func testEditingATimeListsTheFileInChanges() throws {
        let app = try launch(opening: theCage)

        let to = currentChanges(in: app).popUpButtons["row-time-to-0-0"]
        XCTAssertTrue(to.waitForExistence(timeout: 10))
        attachScreenshot(of: currentChanges(in: app), named: "The Cage selected")
        to.click()
        app.menuItems["9:00pm"].click()
        XCTAssertTrue(currentChanges(in: app).popUpButtons["row-time-to-0-0"].wait(until: NSPredicate(format: "value == %@", "9:00pm"), timeout: 5))
        attachScreenshot(of: currentChanges(in: app), named: "Weekday close changed to 9pm")

        openOverview(in: app)
        XCTAssertTrue(currentChanges(in: app).staticTexts["building-hours/1-1-cage.yaml"].waitForExistence(timeout: 5))
    }

    func testAddingARowAddsItToTheTimeline() throws {
        let app = try launch(opening: theCage)
        let add = currentChanges(in: app).buttons["add-row-0"]
        XCTAssertTrue(add.waitForExistence(timeout: 10))
        let before = currentChanges(in: app).popUpButtons.matching(identifier: "row-time-from-0-2").count
        add.click()
        XCTAssertTrue(currentChanges(in: app).popUpButtons["row-time-from-0-2"].waitForExistence(timeout: 5))
        XCTAssertEqual(before, 0)
        attachScreenshot(of: currentChanges(in: app), named: "Row added to the first schedule")
    }

    func testATitleTypedBeforeChoosingAnotherBuildingStaysWithItsOwn() throws {
        let app = try launch(opening: theCage)
        let title = currentChanges(in: app).textFields["service-title-0"]
        XCTAssertTrue(title.waitForExistence(timeout: 10))
        title.click()
        title.typeKey("a", modifierFlags: .command)
        // no Return: choosing another building is as good as done
        title.typeText("Weekday hours")
        currentChanges(in: app).outlines["record-list"].staticTexts["Stav Hall"].click()
        XCTAssertTrue(title.wait(until: NSPredicate(format: "value != %@", "Weekday hours"), timeout: 10))

        // what the file holds, once The Cage is opened afresh
        selectTheCage(in: app)
        XCTAssertTrue(title.wait(until: NSPredicate(format: "value == %@", "Weekday hours"), timeout: 10))
    }

    func testEmptyingATitleShowsAProblem() throws {
        let app = try launch(opening: theCage)
        let title = currentChanges(in: app).textFields["service-title-0"]
        XCTAssertTrue(title.waitForExistence(timeout: 10))
        title.click()
        title.typeKey("a", modifierFlags: .command)
        title.typeKey(.delete, modifierFlags: [])
        title.typeKey(.return, modifierFlags: [])
        XCTAssertTrue(currentChanges(in: app).descendants(matching: .any)["problems"].firstMatch.waitForExistence(timeout: 5))
        XCTAssertTrue(currentChanges(in: app).staticTexts["The title can't be empty."].waitForExistence(timeout: 5))
        XCTAssertTrue(currentChanges(in: app).staticTexts["Usual hours › schedule 1 › title"].exists)
        attachScreenshot(of: currentChanges(in: app), named: "Title emptied reads in plain words")
    }

    func testAProblemInAnotherBuildingNamesThatBuilding() throws {
        let app = try launch(opening: theCage)
        let title = currentChanges(in: app).textFields["service-title-0"]
        XCTAssertTrue(title.waitForExistence(timeout: 10))
        title.click()
        title.typeKey("a", modifierFlags: .command)
        title.typeKey(.delete, modifierFlags: [])
        title.typeKey(.return, modifierFlags: [])
        XCTAssertTrue(currentChanges(in: app).staticTexts["The title can't be empty."].waitForExistence(timeout: 5))

        // Stav Hall's file is fine, and its editor shows only its own problems
        currentChanges(in: app).outlines["record-list"].staticTexts["Stav Hall"].click()
        XCTAssertTrue(currentChanges(in: app).textFields["service-title-0"].wait(until: NSPredicate(format: "value != %@", ""), timeout: 10))
        XCTAssertFalse(currentChanges(in: app).staticTexts["The Cage: The title can't be empty."].exists)
        attachScreenshot(of: currentChanges(in: app), named: "Stav Hall shows none of The Cage's problems")

        // the Overview lists it, where the contributor goes to submit
        openOverview(in: app)
        // each problem is a button that opens its building, labelled by its message and its place
        let named = NSPredicate(format: "label CONTAINS %@ OR value CONTAINS %@", "The Cage: The title can't be empty.", "The Cage: The title can't be empty.")
        XCTAssertTrue(currentChanges(in: app).descendants(matching: .any).matching(named).firstMatch.waitForExistence(timeout: 5))
        let reason = NSPredicate(format: "label CONTAINS %@ OR value CONTAINS %@", "Fix the problems listed above", "Fix the problems listed above")
        let found = currentChanges(in: app).descendants(matching: .any).matching(reason).firstMatch
        XCTAssertTrue(found.exists)
        attachScreenshot(of: currentChanges(in: app), named: "The Overview lists the problem before Submit")
    }

    func testATitleBeingTypedIsSavedBeforeTheOverviewOpens() throws {
        let app = try launch(opening: theCage)
        let title = currentChanges(in: app).textFields["service-title-0"]
        XCTAssertTrue(title.waitForExistence(timeout: 10))
        title.click()
        title.typeKey(.rightArrow, modifierFlags: .command)
        // no Return: choosing the Overview saves it first
        title.typeText(" today")
        openOverview(in: app)
        let saved = NSPredicate(format: "value CONTAINS %@ OR label CONTAINS %@", "title: Hours today", "title: Hours today")
        XCTAssertTrue(currentChanges(in: app).descendants(matching: .any).matching(saved).firstMatch.waitForExistence(timeout: 10))
    }

    func testQuittingSavesATitleBeingTyped() throws {
        let app = try launch(opening: theCage)
        let title = currentChanges(in: app).textFields["service-title-0"]
        XCTAssertTrue(title.waitForExistence(timeout: 10))
        title.click()
        title.typeKey(.rightArrow, modifierFlags: .command)
        title.typeText(" today")
        app.typeKey("q", modifierFlags: .command)
        XCTAssertTrue(app.wait(for: .notRunning, timeout: 20))
        let cage = try XCTUnwrap(data).appending(path: "building-hours/1-1-cage.yaml")
        XCTAssertTrue(try String(contentsOf: cage, encoding: .utf8).contains("  - title: Hours today\n"))
    }

    func testTogglingADayMovesItOnTheTimeline() throws {
        let app = try launch(opening: theCage)
        // a segmented control that takes any number of days reads as a group of checkboxes
        let days = currentChanges(in: app).groups["days-0-0"]
        XCTAssertTrue(days.waitForExistence(timeout: 10))
        days.checkBoxes["Sat"].click()
        // the weekday row now holds Saturday too
        let cage = try XCTUnwrap(data).appending(path: "building-hours/1-1-cage.yaml")
        let saved = NSPredicate { _, _ in
            (try? String(contentsOf: cage, encoding: .utf8))?.contains("days: [Mo, Tu, We, Th, Fr, Sa]") == true
        }
        XCTAssertEqual(XCTWaiter().wait(for: [XCTNSPredicateExpectation(predicate: saved, object: nil)], timeout: 5), .completed)
        attachScreenshot(of: currentChanges(in: app), named: "Saturday added to the weekday row")
    }

    func testClosingAServiceAndOpeningItAgain() throws {
        let app = try launch(opening: theCage)
        let closed = currentChanges(in: app).descendants(matching: .any)["closed-0"].firstMatch
        XCTAssertTrue(closed.waitForExistence(timeout: 10))
        closed.click()
        XCTAssertTrue(currentChanges(in: app).popUpButtons["row-time-from-0-0"].wait(until: NSPredicate(format: "exists == false"), timeout: 5))
        attachScreenshot(of: currentChanges(in: app), named: "Hours closed")
        closed.click()
        XCTAssertTrue(currentChanges(in: app).popUpButtons["row-time-from-0-0"].waitForExistence(timeout: 5))
        attachScreenshot(of: currentChanges(in: app), named: "Hours open again")
    }

    func testDoubleClickingRemoveTakesOneRow() throws {
        let app = try launch(opening: theCage)
        let remove = currentChanges(in: app).buttons["remove-row-0-0"]
        XCTAssertTrue(remove.waitForExistence(timeout: 10))
        remove.doubleClick()
        XCTAssertTrue(currentChanges(in: app).popUpButtons["row-time-from-0-1"].wait(until: NSPredicate(format: "exists == false"), timeout: 5))
        XCTAssertTrue(currentChanges(in: app).popUpButtons["row-time-from-0-0"].exists)
    }

    func testRemovingAServiceWaitsForATitleBeingTyped() throws {
        let app = try launch(opening: theCage)
        let title = currentChanges(in: app).textFields["service-title-1"]
        XCTAssertTrue(title.waitForExistence(timeout: 10))
        let remove = currentChanges(in: app).buttons["remove-service-0"]
        XCTAssertTrue(remove.isEnabled)
        title.click()
        title.typeText(" swipe")
        // removing the first service would move the second, whose title is still a draft
        XCTAssertTrue(remove.wait(until: NSPredicate(format: "isEnabled == false"), timeout: 5))
        title.typeKey(.return, modifierFlags: [])
        XCTAssertTrue(remove.wait(until: NSPredicate(format: "isEnabled == true"), timeout: 5))
    }

    func testATitleWhoseScheduleChangedIsLetGoAndKeptInSight() throws {
        let app = try launch(opening: theCage)
        let title = currentChanges(in: app).textFields["service-title-0"]
        XCTAssertTrue(title.waitForExistence(timeout: 10))
        title.click()
        // a click in the right-aligned field puts the caret before the text
        title.typeKey(.rightArrow, modifierFlags: .command)
        title.typeText(" today")

        // an update changes the draft's schedule beyond its title, so no schedule is the one it was typed for
        let cage = try XCTUnwrap(data).appending(path: "building-hours/1-1-cage.yaml")
        let yaml = try String(contentsOf: cage, encoding: .utf8)
        XCTAssertTrue(yaml.contains("  - title: Hours\n    notes: The kitchen stops cooking at 8 p.m.\n"))
        try yaml.replacingOccurrences(of: "  - title: Hours\n    notes: The kitchen stops cooking at 8 p.m.\n",
                                      with: "  - title: Open\n    notes: The kitchen stops cooking at 9 p.m.\n")
            .write(to: cage, atomically: true, encoding: .utf8)
        title.typeKey(.return, modifierFlags: [])

        XCTAssertTrue(title.wait(until: NSPredicate(format: "value == %@", "Open"), timeout: 5))
        let kept = NSPredicate(format: "value CONTAINS %@ OR label CONTAINS %@", "Hours today", "Hours today")
        XCTAssertTrue(currentChanges(in: app).descendants(matching: .any).matching(kept).firstMatch.waitForExistence(timeout: 5))
        XCTAssertTrue(currentChanges(in: app).buttons["remove-service-0"].wait(until: NSPredicate(format: "isEnabled == true"), timeout: 5))
        attachScreenshot(of: currentChanges(in: app), named: "Title let go after its schedule changed")

        // the field takes new text again
        title.click()
        title.typeKey(.rightArrow, modifierFlags: .command)
        title.typeText(" late\r")
        XCTAssertTrue(currentChanges(in: app).buttons["remove-service-0"].wait(until: NSPredicate(format: "isEnabled == true"), timeout: 5))
        XCTAssertTrue(title.wait(until: NSPredicate(format: "value == %@", "Open late"), timeout: 5))
    }

    func testATitleWhoseScheduleMovedIsSavedWhereItWent() throws {
        let app = try launch(opening: theCage)
        let title = currentChanges(in: app).textFields["service-title-0"]
        XCTAssertTrue(title.waitForExistence(timeout: 10))
        title.click()
        title.typeKey(.rightArrow, modifierFlags: .command)
        title.typeText(" today")

        // an update renames the draft's schedule and puts another above it
        let cage = try XCTUnwrap(data).appending(path: "building-hours/1-1-cage.yaml")
        let yaml = try String(contentsOf: cage, encoding: .utf8)
        XCTAssertTrue(yaml.contains("schedule:\n  - title: Hours\n"))
        try yaml.replacingOccurrences(of: "schedule:\n  - title: Hours\n", with: """
            schedule:
              - title: Brunch
                hours:
                  - {days: [Su], from: '10:00am', to: '1:00pm'}

              - title: Open

            """).write(to: cage, atomically: true, encoding: .utf8)
        title.typeKey(.return, modifierFlags: [])

        // what was typed replaces the new title, in the schedule's new place, without a notice
        XCTAssertTrue(currentChanges(in: app).textFields["service-title-1"].wait(until: NSPredicate(format: "value == %@", "Hours today"), timeout: 5))
        XCTAssertTrue(title.wait(until: NSPredicate(format: "value == %@", "Brunch"), timeout: 5))
        XCTAssertFalse(currentChanges(in: app).buttons["dismiss-draft-notice-0"].exists)
        let saved = try String(contentsOf: cage, encoding: .utf8)
        XCTAssertTrue(saved.contains("  - title: Brunch\n"))
        XCTAssertTrue(saved.contains("  - title: Hours today\n"))
        attachScreenshot(of: currentChanges(in: app), named: "Title saved in its schedule after it moved")
    }

    func testReturnSavesANote() throws {
        let app = try launch(opening: theCage)
        let notes = currentChanges(in: app).textFields["service-notes-0"]
        XCTAssertTrue(notes.waitForExistence(timeout: 10))
        notes.click()
        notes.typeKey("a", modifierFlags: .command)
        notes.typeText("Cash only\r")
        // saved: a removal that waits for drafts is allowed again, and the note has no new line
        XCTAssertTrue(currentChanges(in: app).buttons["remove-service-0"].wait(until: NSPredicate(format: "isEnabled == true"), timeout: 5))
        XCTAssertEqual(notes.value as? String, "Cash only")
    }

    func testAConflictedFileCannotBeEdited() throws {
        let app = try launch(conflicted: "building-hours/1-1-cage.yaml", opening: theCage)
        XCTAssertTrue(currentChanges(in: app).descendants(matching: .any)["edit-lock"].firstMatch.waitForExistence(timeout: 10))
        XCTAssertFalse(currentChanges(in: app).buttons["add-row-0"].isEnabled)
        attachScreenshot(of: currentChanges(in: app), named: "Conflicted file locked")
        // the lock leads to where the contributor chooses
        currentChanges(in: app).buttons["Choose a Version…"].click()
        XCTAssertTrue(currentChanges(in: app).buttons["keep-mine-building-hours/1-1-cage.yaml"].waitForExistence(timeout: 5))
    }

    func testThePreviewWaitsToBeStarted() throws {
        let app = try launch()
        attachScreenshot(of: currentChanges(in: app), named: "Window as the launch returns")
        let status = currentChanges(in: app).buttons["server-status"]
        // the control shows while the app starts, and is enabled once it is ready
        XCTAssertTrue(status.wait(until: NSPredicate(format: "isEnabled == true"), timeout: 20))
        XCTAssertEqual(status.label, "Start Preview")
        attachScreenshot(of: app.toolbars.firstMatch, named: "Toolbar with the preview off")
    }
}
