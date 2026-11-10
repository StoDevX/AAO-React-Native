import XCTest

@MainActor
final class HoursEditorUITests: XCTestCase {
    /// A workspace with the repo's data, as if downloaded, and the repo's helper.
    private func launch() throws -> XCUIApplication {
        let repo = URL(filePath: #filePath).deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
        let support = FileManager.default.temporaryDirectory.appending(path: "ui \(UUID().uuidString)")
        let workspace = support.appending(path: "workspace")
        try FileManager.default.createDirectory(at: workspace.appending(path: "base"), withIntermediateDirectories: true)
        try FileManager.default.copyItem(at: repo.appending(path: "data"), to: workspace.appending(path: "data"))
        try FileManager.default.copyItem(at: repo.appending(path: "data"), to: workspace.appending(path: "base/data"))
        try FileManager.default.copyItem(at: repo.appending(path: "images"), to: workspace.appending(path: "images"))
        try Data(#"{"commit":"c1","scriptsTree":"s","modulesTree":"m"}"#.utf8).write(to: workspace.appending(path: "snapshot.json"))
        let app = XCUIApplication()
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
