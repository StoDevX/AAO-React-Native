import XCTest

@MainActor
final class RecordFormUITests: XCTestCase {
    func testEditingAContactShowsInTheOverview() throws {
        let app = try launchWithRepoData(opening: "contact-info:contact-info/1-1-pubsafe.yaml").app
        let button = currentChanges(in: app).textFields["field-buttonText"]
        XCTAssertTrue(button.waitForExistence(timeout: 10))
        attachScreenshot(of: currentChanges(in: app), named: "PubSafe's form")
        button.click()
        button.typeKey("a", modifierFlags: .command)
        button.typeText("Call PubSafe\r")
        openOverview(in: app)
        XCTAssertTrue(currentChanges(in: app).staticTexts["contact-info/1-1-pubsafe.yaml"].waitForExistence(timeout: 5))
        XCTAssertTrue(currentChanges(in: app).staticTexts["+ buttonText: Call PubSafe"].exists)
    }

    /// A new contact holds only its title and section, so it is listed with its problems and holds up Submit.
    func testAddingAContactListsItWithItsProblems() throws {
        let app = try launchWithRepoData(opening: "contact-info").app
        let window = currentChanges(in: app)
        let new = window.buttons["new-record"]
        XCTAssertTrue(new.waitForExistence(timeout: 10))
        new.click()
        let title = app.textFields["new-record-title"]
        XCTAssertTrue(title.waitForExistence(timeout: 5))
        title.click()
        title.typeText("Title IX")
        app.buttons["new-record-add"].click()
        XCTAssertTrue(window.outlines["record-list"].staticTexts["Title IX"].waitForExistence(timeout: 10))
        let missing = NSPredicate(format: "label CONTAINS %@ OR value CONTAINS %@", "Phone Number or Button Link is missing", "Phone Number or Button Link is missing")
        XCTAssertTrue(window.descendants(matching: .any).matching(missing).firstMatch.waitForExistence(timeout: 10))
        attachScreenshot(of: window, named: "A new contact, with its problems")
        openOverview(in: app)
        XCTAssertFalse(window.buttons["Submit for Review…"].isEnabled)
    }

    func testAReadOnlySetCannotBeEdited() throws {
        let app = try launchWithRepoData(opening: "student-wages").app
        let window = currentChanges(in: app)
        XCTAssertTrue(window.staticTexts["Updated monthly from St. Olaf's student compensation page"].waitForExistence(timeout: 10))
        let tier = window.textFields["field-ST.1"]
        XCTAssertTrue(tier.waitForExistence(timeout: 5))
        XCTAssertFalse(tier.isEnabled)
        attachScreenshot(of: window, named: "Student Wages, read only")
    }
}
