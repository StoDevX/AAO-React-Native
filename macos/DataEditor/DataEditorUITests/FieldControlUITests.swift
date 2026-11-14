import XCTest

/// The form's controls for what a field can hold, each tried on a real record.
@MainActor
final class FieldControlUITests: XCTestCase {
    /// Waits until `file` in `data` holds `text`, as an edit reaches it after the helper writes.
    private func waitFor(_ text: String, or other: String? = nil, in file: String, data: URL) -> Bool {
        let deadline = Date().addingTimeInterval(10)
        while Date() < deadline {
            if let held = try? String(contentsOf: data.appending(path: file), encoding: .utf8),
               held.contains(text) || other.map(held.contains) == true { return true }
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

    /// A colour is chosen in a well, whatever form the file writes it in.
    func testColoursAreChosenInWells() throws {
        let app = try launchWithRepoData(opening: "webcams:webcams/2-east-quad.yaml").app
        let window = currentChanges(in: app)
        XCTAssertTrue(window.colorWells["field-accentColor"].waitForExistence(timeout: 10))
        attachScreenshot(of: window, named: "East Quad's accent colour in a well")
    }

    /// The icon is a button showing its symbol, which opens a grid of symbols to search.
    func testASymbolIsChosenFromTheGrid() throws {
        let (app, data) = try launchWithRepoData(opening: "student-work-areas")
        let window = currentChanges(in: app)
        let dining = window.outlines["record-list"].staticTexts["Dining & BonApp"]
        XCTAssertTrue(dining.waitForExistence(timeout: 10))
        dining.click()
        let icon = window.buttons["field-icon"]
        XCTAssertTrue(icon.waitForExistence(timeout: 10))
        icon.click()
        let search = app.textFields["symbol-search"]
        XCTAssertTrue(search.waitForExistence(timeout: 5))
        search.typeText("cup")
        attachScreenshot(of: app.windows.firstMatch, named: "Symbols matching cup")
        app.buttons["symbol-cup.and.saucer"].click()
        XCTAssertTrue(waitFor("icon: cup.and.saucer", in: "student-work-areas.yaml", data: data))
    }

    /// A symbol the grid doesn't list is offered once its whole name is typed.
    func testASymbolTheGridLacksIsOfferedByName() throws {
        let app = try launchWithRepoData(opening: "student-work-areas").app
        let window = currentChanges(in: app)
        let dining = window.outlines["record-list"].staticTexts["Dining & BonApp"]
        XCTAssertTrue(dining.waitForExistence(timeout: 10))
        dining.click()
        let icon = window.buttons["field-icon"]
        XCTAssertTrue(icon.waitForExistence(timeout: 10))
        icon.click()
        let search = app.textFields["symbol-search"]
        XCTAssertTrue(search.waitForExistence(timeout: 5))
        search.typeText("tortoise.fill")
        XCTAssertTrue(app.buttons["symbol-tortoise.fill"].waitForExistence(timeout: 5))
    }

    /// An icon the file names that no symbol has is shown, and said to be wrong.
    func testANameThatIsNoSymbolIsFlagged() throws {
        let (app, data) = try launchWithRepoData(opening: "student-work-areas")
        let file = data.appending(path: "student-work-areas.yaml")
        let text = try String(contentsOf: file, encoding: .utf8)
        try text.replacingOccurrences(of: "icon: fork.knife", with: "icon: not.a.symbol").write(to: file, atomically: true, encoding: .utf8)
        let window = currentChanges(in: app)
        let dining = window.outlines["record-list"].staticTexts["Dining & BonApp"]
        XCTAssertTrue(dining.waitForExistence(timeout: 10))
        dining.click()
        let flag = window.staticTexts["symbol-problem-field-icon"]
        XCTAssertTrue(flag.waitForExistence(timeout: 10))
        XCTAssertEqual(flag.value as? String, "“not.a.symbol” isn't an SF Symbol. Choose one from the list.")
        attachScreenshot(of: window, named: "An icon that is no symbol")
    }

    /// A bus time is set in a time field, not typed as text.
    func testABusTimeIsSetInATimeField() throws {
        let (app, data) = try launchWithRepoData(opening: "bus-times:bus-times/1-express.yaml")
        let window = currentChanges(in: app)
        let expand = window.links["expand-all-field-schedules.#1.times"]
        XCTAssertTrue(expand.waitForExistence(timeout: 10))
        expand.click()
        let time = window.datePickers["field-schedules.#1.times.#1.#1"]
        XCTAssertTrue(time.waitForExistence(timeout: 5))
        // the hour is first: a step up makes 3:00pm 4:00pm
        time.coordinate(withNormalizedOffset: CGVector(dx: 0.1, dy: 0.5)).click()
        time.typeKey(.upArrow, modifierFlags: [])
        time.typeKey(.return, modifierFlags: [])
        attachScreenshot(of: window, named: "The Express's first trip, its times in time fields")
        // the edited time may be quoted, as the helper writes a time it sets
        XCTAssertTrue(waitFor("[4:00pm, 3:08pm", or: "['4:00pm', 3:08pm", in: "bus-times/1-express.yaml", data: data))
    }

    /// A schedule's days are one control, a segment a day.
    func testAScheduleDaysAreOneControl() throws {
        let (app, data) = try launchWithRepoData(opening: "bus-times:bus-times/1-express.yaml")
        let window = currentChanges(in: app)
        // AppKit's select-any segmented control shows each segment as a checkbox
        let days = window.groups["field-schedules.#1.days"]
        XCTAssertTrue(days.waitForExistence(timeout: 10))
        days.checkBoxes["Sun"].click()
        attachScreenshot(of: window, named: "The Express's days in one control")
        XCTAssertTrue(waitFor("- Su\n", in: "bus-times/1-express.yaml", data: data))
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
