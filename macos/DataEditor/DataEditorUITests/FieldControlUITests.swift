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

    /// The symbol search keeps its width as a search is typed into it.
    func testTheSymbolSearchKeepsItsWidthAsItIsTyped() throws {
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
        let popover = app.popovers.firstMatch
        let empty = (search: search.frame, popover: popover.frame)
        attachScreenshot(of: app.windows.firstMatch, named: "The symbol search, empty")
        search.typeText("cup")
        attachScreenshot(of: app.windows.firstMatch, named: "The symbol search, with cup typed")
        XCTAssertEqual(search.frame, empty.search)
        XCTAssertEqual(popover.frame, empty.popover)
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

    /// FAQ targets are tokens: a new one is typed and Return adds it, keeping the others and their comments.
    func testAFAQsTargetsAreTokens() throws {
        let (app, data) = try launchWithRepoData(opening: "faqs")
        let window = currentChanges(in: app)
        let faq = window.outlines["record-list"].staticTexts["Why can't I log in and see my balances?"]
        XCTAssertTrue(faq.waitForExistence(timeout: 10))
        faq.click()
        let targets = window.textFields["field-targets"]
        XCTAssertTrue(targets.waitForExistence(timeout: 10))
        targets.click()
        targets.typeKey(.rightArrow, modifierFlags: .command)
        targets.typeText("Home\r")
        attachScreenshot(of: window, named: "An FAQ's targets as tokens")
        XCTAssertTrue(waitFor("- Home\n", in: "faqs.yaml", data: data))
        let text = try String(contentsOf: data.appending(path: "faqs.yaml"), encoding: .utf8)
        XCTAssertTrue(text.contains("# the same screen, under its name in app versions already installed"))
    }

    /// A list of tokens too long for one line wraps onto more, all of them shown.
    func testTokensTooManyForOneLineWrapOntoMore() throws {
        let app = try launchWithRepoData(opening: "map-categories:map-categories.yaml").app
        let window = currentChanges(in: app)
        let expand = window.links["expand-all-field-stolaf.groups"]
        XCTAssertTrue(expand.waitForExistence(timeout: 10))
        expand.click()
        // Services lists five categories; Bike Racks one
        let five = window.textFields["field-stolaf.groups.#9.categories"]
        let one = window.textFields["field-stolaf.groups.#7.categories"]
        XCTAssertTrue(five.waitForExistence(timeout: 10))
        let form = window.coordinate(withNormalizedOffset: CGVector(dx: 0.65, dy: 0.5))
        for _ in 0..<40 where !five.isHittable { form.scroll(byDeltaX: 0, deltaY: -400) }
        attachScreenshot(of: window, named: "Services' five categories")
        XCTAssertGreaterThan(five.frame.height, one.frame.height * 1.5)
    }

    /// A stop's coordinates are one row, its latitude and longitude side by side, written back on one line.
    func testAStopsCoordinatesAreOneRowOfLatitudeAndLongitude() throws {
        let (app, data) = try launchWithRepoData(opening: "bus-times:bus-times/1-express.yaml")
        let window = currentChanges(in: app)
        let latitude = window.textFields["field-schedules.#1.coordinates.Library-latitude"]
        XCTAssertTrue(latitude.waitForExistence(timeout: 10))
        XCTAssertEqual(latitude.value as? String, "44.457643")
        XCTAssertEqual(window.textFields["field-schedules.#1.coordinates.Library-longitude"].value as? String, "-93.158715")
        attachScreenshot(of: window, named: "The Express's stop coordinates")
        latitude.doubleClick()
        latitude.typeKey("a", modifierFlags: .command)
        latitude.typeText("44.5\r")
        XCTAssertTrue(waitFor("Library: [44.5, -93.158715]", in: "bus-times/1-express.yaml", data: data))
    }

    /// A paragraph's field sits under its name, both from the left, so a sentence reads as one.
    func testAParagraphsFieldSitsUnderItsName() throws {
        let app = try launchWithRepoData(opening: "bus-times:bus-times/1-express.yaml").app
        let window = currentChanges(in: app)
        let notice = window.textFields["field-notice"]
        XCTAssertTrue(notice.waitForExistence(timeout: 10))
        let name = window.staticTexts["Notice"]
        attachScreenshot(of: window, named: "The Express's notice under its name")
        XCTAssertGreaterThanOrEqual(notice.frame.minY, name.frame.maxY)
        XCTAssertEqual(notice.frame.minX, name.frame.minX, accuracy: 8)
    }

    /// An empty field says what goes in it, so a new group shows where to type.
    func testANewGroupsEmptyFieldsSayWhatGoesInThem() throws {
        let app = try launchWithRepoData(opening: "map-categories:map-categories.yaml").app
        let window = currentChanges(in: app)
        let add = window.buttons["add-field-stolaf.groups"]
        XCTAssertTrue(add.waitForExistence(timeout: 10))
        add.click()
        let label = window.textFields["field-stolaf.groups.#14.label"]
        XCTAssertTrue(label.waitForExistence(timeout: 10))
        attachScreenshot(of: window, named: "A new group, empty")
        XCTAssertEqual(label.placeholderValue, "Label")
    }

    /// A new group is ready to type into: its first field has focus.
    func testANewGroupsFirstFieldTakesWhatIsTyped() throws {
        let (app, data) = try launchWithRepoData(opening: "map-categories:map-categories.yaml")
        let window = currentChanges(in: app)
        let add = window.buttons["add-field-stolaf.groups"]
        XCTAssertTrue(add.waitForExistence(timeout: 10))
        add.click()
        XCTAssertTrue(window.textFields["field-stolaf.groups.#14.label"].waitForExistence(timeout: 10))
        app.typeText("Food Trucks\r")
        XCTAssertTrue(waitFor("label: Food Trucks", in: "map-categories.yaml", data: data))
    }

    /// A food item's station is chosen from the stations the menu lists.
    func testAFoodItemsStationIsChosenFromTheStations() throws {
        let (app, data) = try launchWithRepoData(opening: "pause-menu:pause-menu.yaml")
        let window = currentChanges(in: app)
        let expand = window.links["expand-all-field-foodItems"]
        XCTAssertTrue(expand.waitForExistence(timeout: 10))
        expand.click()
        let station = window.popUpButtons["field-foodItems.#1.station"]
        XCTAssertTrue(station.waitForExistence(timeout: 10))
        station.click()
        app.menuItems["Pita"].click()
        XCTAssertTrue(waitFor("station: Pita", in: "pause-menu.yaml", data: data))
    }

    /// Clicks the field `second` after `first`, both in Map Categories with every
    /// list open, and says where `second` was before the click and after it.
    private func clickAfter(_ first: String, _ second: String) throws -> (before: CGRect, after: CGRect) {
        let app = try launchWithRepoData(opening: "map-categories:map-categories.yaml").app
        let window = currentChanges(in: app)
        for list in ["stolaf.groups", "stolaf.icons", "carleton.groups", "carleton.icons"] {
            let expand = window.links["expand-all-field-\(list)"]
            XCTAssertTrue(expand.waitForExistence(timeout: 10))
            expand.click()
        }
        let earlier = window.textFields[first]
        XCTAssertTrue(earlier.waitForExistence(timeout: 10))
        earlier.click()
        let field = window.textFields[second]
        // scrolled at a point in the form, which is the window's right-hand part
        let form = window.coordinate(withNormalizedOffset: CGVector(dx: 0.65, dy: 0.5))
        for _ in 0..<40 where !field.isHittable { form.scroll(byDeltaX: 0, deltaY: -400) }
        XCTAssertTrue(field.isHittable)
        let before = field.frame
        field.click()
        RunLoop.current.run(until: Date().addingTimeInterval(1))
        attachScreenshot(of: window, named: "After clicking \(second)")
        return (before, field.frame)
    }

    /// A field clicked stays where it is, though a field in another list at the same index had focus before it.
    func testAFieldClickedStaysPutAfterOneAtItsIndexInAnotherList() throws {
        let place = try clickAfter("field-stolaf.groups.#7.categories", "field-stolaf.icons.#7.categories")
        XCTAssertEqual(place.after, place.before)
    }

    /// A field clicked stays where it is, though the same field of another campus had focus before it.
    func testAFieldClickedStaysPutAfterTheSameFieldInAnotherObject() throws {
        let place = try clickAfter("field-stolaf.groups.#7.categories", "field-carleton.groups.#7.categories")
        XCTAssertEqual(place.after, place.before)
    }

    /// A generated bus line can't be edited, its pickers included.
    func testALockedSetsPickersAreDisabled() throws {
        let app = try launchWithRepoData(opening: "bus-times:bus-times/3-red-line.yaml").app
        let window = currentChanges(in: app)
        let day = window.groups["timetable-1-days"].checkBoxes.firstMatch
        XCTAssertTrue(day.waitForExistence(timeout: 10))
        XCTAssertFalse(day.isEnabled)
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
