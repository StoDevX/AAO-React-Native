import XCTest

@MainActor
final class RecordFormUITests: XCTestCase {
    /// Opens `record` of the data set titled `set` in the Current changes window.
    private func open(_ record: String?, of set: String, in app: XCUIApplication) {
        let window = currentChanges(in: app)
        let row = window.outlines["data-set-list"].staticTexts[set]
        XCTAssertTrue(row.waitForExistence(timeout: 20))
        row.click()
        if let record {
            let recordRow = window.outlines["record-list"].staticTexts[record]
            XCTAssertTrue(recordRow.waitForExistence(timeout: 10))
            recordRow.click()
        }
    }

    func testEditingAContactShowsInTheOverview() throws {
        let app = try launchWithRepoData().app
        open("PubSafe", of: "Important Contacts", in: app)
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

    func testAReadOnlySetCannotBeEdited() throws {
        let app = try launchWithRepoData().app
        open(nil, of: "Student Wages", in: app)
        let window = currentChanges(in: app)
        XCTAssertTrue(window.staticTexts["Updated monthly from St. Olaf's student compensation page"].waitForExistence(timeout: 10))
        let tier = window.textFields["field-ST.1"]
        XCTAssertTrue(tier.waitForExistence(timeout: 5))
        XCTAssertFalse(tier.isEnabled)
        attachScreenshot(of: window, named: "Student Wages, read only")
    }
}
