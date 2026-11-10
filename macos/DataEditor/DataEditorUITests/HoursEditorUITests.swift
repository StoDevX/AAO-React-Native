import XCTest

@MainActor
final class HoursEditorUITests: XCTestCase {
    /// A workspace with the repo's data, as if downloaded, and the repo's helper.
    /// A `conflicted` file is set aside as a conflict, as an update leaves one.
    private func launch(conflicted: String? = nil) throws -> XCUIApplication {
        let repo = URL(filePath: #filePath).deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
        let support = FileManager.default.temporaryDirectory.appending(path: "ui \(UUID().uuidString)")
        let workspace = support.appending(path: "workspace")
        try FileManager.default.createDirectory(at: workspace.appending(path: "base"), withIntermediateDirectories: true)
        try FileManager.default.copyItem(at: repo.appending(path: "data"), to: workspace.appending(path: "data"))
        try FileManager.default.copyItem(at: repo.appending(path: "data"), to: workspace.appending(path: "base/data"))
        try FileManager.default.copyItem(at: repo.appending(path: "images"), to: workspace.appending(path: "images"))
        try Data(#"{"commit":"c1","scriptsTree":"s","modulesTree":"m"}"#.utf8).write(to: workspace.appending(path: "snapshot.json"))
        if let conflicted {
            let kept = workspace.appending(path: "conflicts/\(conflicted)")
            try FileManager.default.createDirectory(at: kept.deletingLastPathComponent(), withIntermediateDirectories: true)
            try FileManager.default.copyItem(at: repo.appending(path: "data/\(conflicted)"), to: kept)
        }
        let app = XCUIApplication()
        // the app quits first, so nothing writes into the folder as it goes
        addTeardownBlock { @MainActor in
            app.terminate()
            try FileManager.default.removeItem(at: support)
        }
        let node = try XCTUnwrap(ProcessInfo.processInfo.environment["DATA_EDITOR_NODE"], "run with TEST_RUNNER_DATA_EDITOR_NODE=$(mise which node)")
        app.launchArguments = ["-UITestWorkspace", support.path, "-UITestNode", node, "-UITestHelper", repo.appending(path: "scripts").path]
        app.launch()
        return app
    }

    /// Opens The Cage's hours, once the launch has listed the buildings.
    private func selectTheCage(in app: XCUIApplication) {
        let cage = app.outlines["building-list"].staticTexts["The Cage"]
        XCTAssertTrue(cage.waitForExistence(timeout: 20))
        cage.click()
    }

    /// Keeps a screenshot of one element with the run, for a person to check by eye.
    /// A Mac app's own screenshot is the whole screen, with every other app's windows on it.
    private func attachScreenshot(of element: XCUIElement, named name: String) {
        let attachment = XCTAttachment(screenshot: element.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    func testEditingATimeListsTheFileInChanges() throws {
        let app = try launch()
        selectTheCage(in: app)

        let to = app.popUpButtons["row-time-to-0-0"]
        XCTAssertTrue(to.waitForExistence(timeout: 10))
        attachScreenshot(of: app.windows.firstMatch, named: "The Cage selected")
        to.click()
        app.menuItems["9:00pm"].click()
        XCTAssertTrue(app.popUpButtons["row-time-to-0-0"].wait(until: NSPredicate(format: "value == %@", "9:00pm"), timeout: 5))
        attachScreenshot(of: app.windows.firstMatch, named: "Weekday close changed to 9pm")

        app.buttons["Changes"].click()
        XCTAssertTrue(app.staticTexts["building-hours/1-1-cage.yaml"].waitForExistence(timeout: 5))
    }

    func testAddingARowAddsItToTheTimeline() throws {
        let app = try launch()
        selectTheCage(in: app)
        let add = app.buttons["add-row-0"]
        XCTAssertTrue(add.waitForExistence(timeout: 10))
        let before = app.popUpButtons.matching(identifier: "row-time-from-0-2").count
        add.click()
        XCTAssertTrue(app.popUpButtons["row-time-from-0-2"].waitForExistence(timeout: 5))
        XCTAssertEqual(before, 0)
        attachScreenshot(of: app.windows.firstMatch, named: "Row added to the first service")
    }

    func testATitleTypedBeforeChoosingAnotherBuildingStaysWithItsOwn() throws {
        let app = try launch()
        selectTheCage(in: app)
        let title = app.textFields["service-title-0"]
        XCTAssertTrue(title.waitForExistence(timeout: 10))
        title.click()
        title.typeKey("a", modifierFlags: .command)
        // no Return: choosing another building is as good as done
        title.typeText("Weekday hours")
        app.outlines["building-list"].staticTexts["Stav Hall"].click()
        XCTAssertTrue(title.wait(until: NSPredicate(format: "value != %@", "Weekday hours"), timeout: 10))

        // what the file holds, once The Cage is opened afresh
        selectTheCage(in: app)
        XCTAssertTrue(title.wait(until: NSPredicate(format: "value == %@", "Weekday hours"), timeout: 10))
    }

    func testEmptyingATitleShowsAProblem() throws {
        let app = try launch()
        selectTheCage(in: app)
        let title = app.textFields["service-title-0"]
        XCTAssertTrue(title.waitForExistence(timeout: 10))
        title.click()
        title.typeKey("a", modifierFlags: .command)
        title.typeKey(.delete, modifierFlags: [])
        title.typeKey(.return, modifierFlags: [])
        XCTAssertTrue(app.descendants(matching: .any)["problems"].firstMatch.waitForExistence(timeout: 5))
        attachScreenshot(of: app.windows.firstMatch, named: "Title emptied shows a problem")
    }

    func testTogglingADayMovesItOnTheTimeline() throws {
        let app = try launch()
        selectTheCage(in: app)
        let saturday = app.descendants(matching: .any)["day-0-0-Sa"].firstMatch
        XCTAssertTrue(saturday.waitForExistence(timeout: 10))
        saturday.click()
        XCTAssertTrue(app.descendants(matching: .any)["day-0-0-Sa"].firstMatch.wait(until: NSPredicate(format: "value == 1"), timeout: 5))
        attachScreenshot(of: app.windows.firstMatch, named: "Saturday added to the weekday row")
    }

    func testClosingAServiceAndOpeningItAgain() throws {
        let app = try launch()
        selectTheCage(in: app)
        let closed = app.descendants(matching: .any)["closed-0"].firstMatch
        XCTAssertTrue(closed.waitForExistence(timeout: 10))
        closed.click()
        XCTAssertTrue(app.popUpButtons["row-time-from-0-0"].wait(until: NSPredicate(format: "exists == false"), timeout: 5))
        attachScreenshot(of: app.windows.firstMatch, named: "Hours closed")
        closed.click()
        XCTAssertTrue(app.popUpButtons["row-time-from-0-0"].waitForExistence(timeout: 5))
        attachScreenshot(of: app.windows.firstMatch, named: "Hours open again")
    }

    func testDoubleClickingRemoveTakesOneRow() throws {
        let app = try launch()
        selectTheCage(in: app)
        let remove = app.buttons["remove-row-0-0"]
        XCTAssertTrue(remove.waitForExistence(timeout: 10))
        remove.doubleClick()
        XCTAssertTrue(app.popUpButtons["row-time-from-0-1"].wait(until: NSPredicate(format: "exists == false"), timeout: 5))
        XCTAssertTrue(app.popUpButtons["row-time-from-0-0"].exists)
    }

    func testAConflictedFileCannotBeEdited() throws {
        let app = try launch(conflicted: "building-hours/1-1-cage.yaml")
        selectTheCage(in: app)
        XCTAssertTrue(app.descendants(matching: .any)["edit-lock"].firstMatch.waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["add-row-0"].isEnabled)
        attachScreenshot(of: app.windows.firstMatch, named: "Conflicted file locked")
    }

    func testThePreviewWaitsToBeStarted() throws {
        let app = try launch()
        attachScreenshot(of: app.windows.firstMatch, named: "Window as the launch returns")
        let status = app.buttons["server-status"]
        // the control shows while the app starts, and is enabled once it is ready
        XCTAssertTrue(status.wait(until: NSPredicate(format: "isEnabled == true"), timeout: 20))
        XCTAssertEqual(status.label, "Start Preview")
        attachScreenshot(of: app.toolbars.firstMatch, named: "Toolbar with the preview off")
    }
}

private extension XCUIElement {
    /// Waits for the element to match `predicate`, as one does once the app catches up.
    func wait(until predicate: NSPredicate, timeout: TimeInterval) -> Bool {
        XCTWaiter().wait(for: [XCTNSPredicateExpectation(predicate: predicate, object: self)], timeout: timeout) == .completed
    }
}
