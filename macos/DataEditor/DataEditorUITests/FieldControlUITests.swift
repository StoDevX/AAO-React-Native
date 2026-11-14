import XCTest

/// The form's controls for what a field can hold, each tried on a real record.
@MainActor
final class FieldControlUITests: XCTestCase {
    /// Waits until `file` in `data` holds `text`, as an edit reaches it after the helper writes.
    private func waitFor(_ text: String, in file: String, data: URL) -> Bool {
        let deadline = Date().addingTimeInterval(10)
        while Date() < deadline {
            if let held = try? String(contentsOf: data.appending(path: file), encoding: .utf8), held.contains(text) { return true }
            RunLoop.current.run(until: Date().addingTimeInterval(0.2))
        }
        return false
    }

    func testAWorkAreasColorIsChosenWithASwatch() throws {
        let (app, data) = try launchWithRepoData(opening: "student-work-areas")
        let window = currentChanges(in: app)
        let dining = window.outlines["record-list"].staticTexts["Dining & BonApp"]
        XCTAssertTrue(dining.waitForExistence(timeout: 10))
        dining.click()
        let color = window.popUpButtons["field-gradient"]
        XCTAssertTrue(color.waitForExistence(timeout: 10))
        color.click()
        attachScreenshot(of: window, named: "A work area's colours, each with its swatch")
        app.menuItems["mint"].click()
        XCTAssertTrue(waitFor("gradient: mint", in: "student-work-areas.yaml", data: data))
    }

    /// A generated bus line can't be edited, its pickers included.
    func testALockedSetsPickersAreDisabled() throws {
        let app = try launchWithRepoData(opening: "bus-times:bus-times/3-red-line.yaml").app
        let window = currentChanges(in: app)
        let picker = window.popUpButtons.firstMatch
        XCTAssertTrue(picker.waitForExistence(timeout: 10))
        XCTAssertFalse(picker.isEnabled)
    }

    /// No control writes a value just by being drawn: opening each set's first record leaves the data as it was.
    func testOpeningEveryFirstRecordChangesNothing() throws {
        let (app, data) = try launchWithRepoData()
        let window = currentChanges(in: app)
        let sidebar = window.outlines.firstMatch
        XCTAssertTrue(sidebar.waitForExistence(timeout: 10))
        for set in ["Student Work Areas", "Webcams", "Bus Times", "Important Contacts", "FAQs & Notices", "Pause Menu",
                    "KSTO Schedule", "Org Categories", "Map Categories", "Sources", "Dictionary", "Color Printers"] {
            sidebar.staticTexts[set].click()
            let first = window.outlines["record-list"].cells.firstMatch
            if first.waitForExistence(timeout: 5) { first.click() }
            RunLoop.current.run(until: Date().addingTimeInterval(1))
        }
        let base = data.deletingLastPathComponent().appending(path: "base/data")
        let changed = FileManager.default.enumerator(atPath: data.path)?.compactMap { $0 as? String }.filter { file in
            !FileManager.default.contentsEqual(atPath: data.appending(path: file).path, andPath: base.appending(path: file).path)
        } ?? []
        XCTAssertEqual(changed, [])
    }
}
