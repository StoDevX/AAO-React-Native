import XCTest

extension XCTestCase {
    /// Launches the app on a workspace with the repo's data, as if downloaded,
    /// and the repo's helper. A `conflicted` file is set aside as a conflict,
    /// as an update leaves one, `submissions` is planted as the pull requests
    /// submitted before, and `arguments` follow the workspace's. Returns
    /// the app and its data folder, for a test that changes a file under it.
    @MainActor
    func launchWithRepoData(conflicted: String? = nil, submissions: String? = nil,
                            arguments: [String] = []) throws -> (app: XCUIApplication, data: URL) {
        let repo = URL(filePath: #filePath).deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
        let support = FileManager.default.temporaryDirectory.appending(path: "ui \(UUID().uuidString)")
        let workspace = support.appending(path: "workspace")
        try FileManager.default.createDirectory(at: workspace.appending(path: "base"), withIntermediateDirectories: true)
        try FileManager.default.copyItem(at: repo.appending(path: "data"), to: workspace.appending(path: "data"))
        try FileManager.default.copyItem(at: repo.appending(path: "data"), to: workspace.appending(path: "base/data"))
        try FileManager.default.copyItem(at: repo.appending(path: "images"), to: workspace.appending(path: "images"))
        try Data(#"{"commit":"c1","files":{}}"#.utf8).write(to: workspace.appending(path: "snapshot.json"))
        if let conflicted {
            let kept = workspace.appending(path: "conflicts/\(conflicted)")
            try FileManager.default.createDirectory(at: kept.deletingLastPathComponent(), withIntermediateDirectories: true)
            try FileManager.default.copyItem(at: repo.appending(path: "data/\(conflicted)"), to: kept)
        }
        if let submissions {
            try Data(submissions.utf8).write(to: support.appending(path: "submissions.json"))
        }
        let app = XCUIApplication()
        // the app quits first, so nothing writes into the folder as it goes
        addTeardownBlock { @MainActor in
            app.terminate()
            try FileManager.default.removeItem(at: support)
        }
        let node = try XCTUnwrap(ProcessInfo.processInfo.environment["DATA_EDITOR_NODE"], "run with TEST_RUNNER_DATA_EDITOR_NODE=$(mise which node)")
        // each test starts from the Changesets window alone, not the windows an earlier test left open
        app.launchArguments = ["-UITestWorkspace", support.path, "-UITestNode", node, "-UITestHelper", repo.appending(path: "scripts").path,
                               "-ApplePersistenceIgnoreState", "YES"] + arguments
        app.launch()
        return (app, workspace.appending(path: "data"))
    }

    /// Opens the Current changes window from the Changesets window, once the
    /// launch has listed the changesets. The Changesets window stays open and
    /// shows the same Overview, so a test looks for the Overview's controls in
    /// the window this returns.
    @MainActor @discardableResult
    func openCurrentChanges(in app: XCUIApplication) -> XCUIElement {
        let current = app.windows["Changesets"].outlines["changeset-list"].staticTexts["Current changes"]
        XCTAssertTrue(current.waitForExistence(timeout: 20))
        current.doubleClick()
        let window = currentChangesWindow(in: app)
        XCTAssertTrue(window.waitForExistence(timeout: 5))
        return window
    }

    /// The Current changes window, found by its list of every building: its
    /// title follows the building chosen.
    @MainActor
    func currentChangesWindow(in app: XCUIApplication) -> XCUIElement {
        app.windows.containing(.outline, identifier: "building-list").firstMatch
    }

    /// The Current changes window, opened if it is not.
    @MainActor
    func currentChanges(in app: XCUIApplication) -> XCUIElement {
        let window = currentChangesWindow(in: app)
        return window.exists ? window : openCurrentChanges(in: app)
    }

    /// Opens The Cage's hours in the Current changes window.
    @MainActor
    func selectTheCage(in app: XCUIApplication) {
        let cage = currentChanges(in: app).outlines["building-list"].staticTexts["The Cage"]
        XCTAssertTrue(cage.waitForExistence(timeout: 20))
        cage.click()
    }

    /// Opens Current changes' Overview, where the edits, conflicts, problems and Submit are.
    @MainActor
    func openOverview(in app: XCUIApplication) {
        let window = currentChanges(in: app)
        let overview = window.outlines["building-list"].staticTexts["Overview"]
        XCTAssertTrue(overview.waitForExistence(timeout: 5))
        overview.click()
        XCTAssertTrue(window.descendants(matching: .any)["overview-page"].firstMatch.waitForExistence(timeout: 5))
    }

    /// Keeps a screenshot of one element with the run, for a person to check by eye.
    /// A Mac app's own screenshot is the whole screen, with every other app's windows on it.
    @MainActor
    func attachScreenshot(of element: XCUIElement, named name: String) {
        let attachment = XCTAttachment(screenshot: element.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}

extension XCUIElement {
    /// Waits for the element to match `predicate`, as one does once the app catches up.
    func wait(until predicate: NSPredicate, timeout: TimeInterval) -> Bool {
        XCTWaiter().wait(for: [XCTNSPredicateExpectation(predicate: predicate, object: self)], timeout: timeout) == .completed
    }
}
