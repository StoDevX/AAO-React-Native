import XCTest

extension XCTestCase {
    /// Launches the app on a workspace with the repo's data, as if downloaded,
    /// the helper built from the checkout, and the oxfmt the app bundles. A `conflicted` file is set aside as a conflict,
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
        try Data(#"{"commit":"c1"}"#.utf8).write(to: workspace.appending(path: "snapshot.json"))
        // the helper built from the checkout, as the data deploy publishes it
        let helper = repo.appending(path: "macos/DataEditor/build/helper")
        let built = try? helper.appending(path: "helper.js").resourceValues(forKeys: [.contentModificationDateKey]).contentModificationDate
        guard let built else {
            throw LaunchError("run `mise run data-editor:helper` first, to build the helper the UI tests load")
        }
        // a helper built before the scripts last changed would test the old ones
        if let changed = newestChange(under: [repo.appending(path: "scripts"), repo.appending(path: "modules")]), changed.date > built {
            throw LaunchError("\(changed.file) changed after the helper was built; run `mise run data-editor:helper`")
        }
        try FileManager.default.copyItem(at: helper, to: workspace.appending(path: "scripts"))
        // the oxfmt the app bundles; the runner is sandboxed, and the app may not run a file from its container
        let oxfmt = repo.appending(path: "macos/DataEditor/build/runtime/oxfmt")
        guard FileManager.default.isExecutableFile(atPath: oxfmt.path) else {
            throw LaunchError("run `mise run data-editor:runtime` first, for the oxfmt the UI tests format with")
        }
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
        // each test starts from the Changesets window alone, not the windows an earlier test left open
        app.launchArguments = ["-UITestWorkspace", support.path, "-UITestOxfmt", oxfmt.path,
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

/// Why the app could not be launched as a test asked.
struct LaunchError: Error, CustomStringConvertible {
    let description: String
    init(_ description: String) { self.description = description }
}

/// The file changed last under `folders`, leaving out installed dependencies.
private func newestChange(under folders: [URL]) -> (file: String, date: Date)? {
    var newest: (file: String, date: Date)?
    for folder in folders {
        guard let files = FileManager.default.enumerator(at: folder, includingPropertiesForKeys: [.contentModificationDateKey, .isRegularFileKey]) else { continue }
        for case let file as URL in files {
            if file.lastPathComponent == "node_modules" { files.skipDescendants(); continue }
            let values = try? file.resourceValues(forKeys: [.contentModificationDateKey, .isRegularFileKey])
            guard values?.isRegularFile == true, let date = values?.contentModificationDate, date > (newest?.date ?? .distantPast) else { continue }
            newest = (file.path, date)
        }
    }
    return newest
}

extension XCUIElement {
    /// Waits for the element to match `predicate`, as one does once the app catches up.
    func wait(until predicate: NSPredicate, timeout: TimeInterval) -> Bool {
        XCTWaiter().wait(for: [XCTNSPredicateExpectation(predicate: predicate, object: self)], timeout: timeout) == .completed
    }
}
