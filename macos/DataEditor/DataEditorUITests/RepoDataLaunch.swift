import XCTest

extension XCTestCase {
    /// Launches the app on a workspace with the repo's data, as if downloaded,
    /// and the repo's helper. A `conflicted` file is set aside as a conflict,
    /// as an update leaves one, and `arguments` follow the workspace's. Returns
    /// the app and its data folder, for a test that changes a file under it.
    @MainActor
    func launchWithRepoData(conflicted: String? = nil, arguments: [String] = []) throws -> (app: XCUIApplication, data: URL) {
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
        app.launchArguments = ["-UITestWorkspace", support.path, "-UITestNode", node, "-UITestHelper", repo.appending(path: "scripts").path] + arguments
        app.launch()
        return (app, workspace.appending(path: "data"))
    }

    /// Opens The Cage's hours, once the launch has listed the buildings.
    @MainActor
    func selectTheCage(in app: XCUIApplication) {
        let cage = app.outlines["building-list"].staticTexts["The Cage"]
        XCTAssertTrue(cage.waitForExistence(timeout: 20))
        cage.click()
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
