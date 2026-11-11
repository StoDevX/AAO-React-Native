import XCTest

@MainActor
final class ChangesUITests: XCTestCase {
    /// Moves The Cage's weekday close to 9pm and opens the Changes sheet.
    private func changeTheCageAndOpenChanges(in app: XCUIApplication) {
        selectTheCage(in: app)
        let to = app.popUpButtons["row-time-to-0-0"]
        XCTAssertTrue(to.waitForExistence(timeout: 10))
        to.click()
        app.menuItems["9:00pm"].click()
        XCTAssertTrue(to.wait(until: NSPredicate(format: "value == %@", "9:00pm"), timeout: 5))
        app.buttons["Changes"].click()
        XCTAssertTrue(app.staticTexts["building-hours/1-1-cage.yaml"].waitForExistence(timeout: 5))
    }

    func testRevertingAChangeEmptiesTheList() throws {
        let app = try launchWithRepoData().app
        changeTheCageAndOpenChanges(in: app)

        XCTAssertTrue(app.staticTexts["-       - {days: [Mo, Tu, We, Th, Fr], from: '7:30am', to: '8:00pm'}"].exists)
        XCTAssertTrue(app.staticTexts["+       - {days: [Mo, Tu, We, Th, Fr], from: '7:30am', to: '9:00pm'}"].exists)
        attachScreenshot(of: app.windows.firstMatch, named: "Changes with The Cage's diff")

        app.buttons["revert-building-hours/1-1-cage.yaml"].click()
        let confirm = app.buttons["confirm-revert"]
        XCTAssertTrue(confirm.waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Revert The Cage?"].exists)
        attachScreenshot(of: app.windows.firstMatch, named: "Revert asks first")
        confirm.click()

        XCTAssertTrue(app.staticTexts["No changes yet"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["Submit for Review…"].isEnabled)
        attachScreenshot(of: app.windows.firstMatch, named: "Changes empty after the revert")
    }

    func testSubmittingWithoutAGitHubSignInSaysSo() throws {
        let app = try launchWithRepoData(arguments: ["-UITestGitHubClientID", ""]).app
        changeTheCageAndOpenChanges(in: app)

        app.buttons["Submit for Review…"].click()
        let summary = app.textFields["submit-summary"]
        XCTAssertTrue(summary.waitForExistence(timeout: 5))
        let refusal = NSPredicate(format: "value CONTAINS %@ OR label CONTAINS %@", "can't submit changes", "can't submit changes")
        XCTAssertTrue(app.descendants(matching: .any).matching(refusal).firstMatch.exists)
        attachScreenshot(of: app.windows.firstMatch, named: "Submit sheet as it opens, with no client ID")

        // a summary alone does not make it submittable
        summary.click()
        summary.typeText("Close The Cage at 9 p.m.")
        XCTAssertFalse(app.buttons["submit-confirm"].isEnabled)
        app.buttons["Cancel"].click()
        XCTAssertTrue(summary.wait(until: NSPredicate(format: "exists == false"), timeout: 5))
    }

    func testANoticeOfTextNotSavedDoesNotStopSubmitting() throws {
        let (app, data) = try launchWithRepoData()
        selectTheCage(in: app)
        // an edit through the app, so Changes lists the file; the write below is not one
        let to = app.popUpButtons["row-time-to-0-0"]
        XCTAssertTrue(to.waitForExistence(timeout: 10))
        to.click()
        app.menuItems["9:00pm"].click()
        XCTAssertTrue(to.wait(until: NSPredicate(format: "value == %@", "9:00pm"), timeout: 5))
        let title = app.textFields["service-title-0"]
        XCTAssertTrue(title.waitForExistence(timeout: 10))
        title.click()
        title.typeKey(.rightArrow, modifierFlags: .command)
        title.typeText(" today")
        // the file changes under the draft, so the draft is let go with a notice
        let cage = data.appending(path: "building-hours/1-1-cage.yaml")
        let yaml = try String(contentsOf: cage, encoding: .utf8)
        try yaml.replacingOccurrences(of: "  - title: Hours\n", with: "  - title: Open\n").write(to: cage, atomically: true, encoding: .utf8)
        title.typeKey(.return, modifierFlags: [])
        let dismiss = app.buttons["dismiss-draft-notice-0"]
        XCTAssertTrue(dismiss.waitForExistence(timeout: 5))

        app.buttons["Changes"].click()
        XCTAssertTrue(app.buttons["Submit for Review…"].wait(until: NSPredicate(format: "isEnabled == true"), timeout: 5))
        app.buttons["Close"].click()

        dismiss.click()
        XCTAssertTrue(dismiss.wait(until: NSPredicate(format: "exists == false"), timeout: 5))
    }

    func testAConflictShowsBothVersionsBeforeAsking() throws {
        let file = "building-hours/1-1-cage.yaml"
        let (app, data) = try launchWithRepoData(conflicted: file)
        // the contributor's copy, set aside by the update, closes at 9pm
        let kept = data.deletingLastPathComponent().appending(path: "conflicts/\(file)")
        let yaml = try String(contentsOf: kept, encoding: .utf8)
        let weekdays = "      - {days: [Mo, Tu, We, Th, Fr], from: '7:30am', to: '8:00pm'}"
        XCTAssertTrue(yaml.contains(weekdays))
        try yaml.replacingOccurrences(of: weekdays, with: "      - {days: [Mo, Tu, We, Th, Fr], from: '7:30am', to: '9:00pm'}")
            .write(to: kept, atomically: true, encoding: .utf8)

        let changes = app.buttons["Changes"]
        XCTAssertTrue(changes.wait(until: NSPredicate(format: "isEnabled == true"), timeout: 20))
        attachScreenshot(of: app.windows.firstMatch, named: "Changes badge and sidebar mark for a conflict")
        changes.click()

        let sheet = app.sheets.firstMatch
        XCTAssertTrue(sheet.staticTexts["The Cage changed on GitHub too. Which version should stay?"].waitForExistence(timeout: 5))
        sheet.buttons["show-differences-\(file)"].click()
        XCTAssertTrue(sheet.staticTexts["- \(weekdays)"].waitForExistence(timeout: 5))
        XCTAssertTrue(sheet.staticTexts["+       - {days: [Mo, Tu, We, Th, Fr], from: '7:30am', to: '9:00pm'}"].exists)
        attachScreenshot(of: app.windows.firstMatch, named: "Conflict with its differences shown")

        sheet.buttons["keep-mine-\(file)"].click()
        XCTAssertTrue(sheet.buttons["revert-\(file)"].waitForExistence(timeout: 5))
        XCTAssertFalse(sheet.buttons["keep-mine-\(file)"].exists)
    }

    func testTheDataBrowserAsksForThePreviewWhileItIsOff() throws {
        let app = try launchWithRepoData().app
        let browse = app.buttons["Data Browser"]
        XCTAssertTrue(browse.wait(until: NSPredicate(format: "isEnabled == true"), timeout: 20))
        browse.click()

        let window = app.windows["Data Browser"]
        XCTAssertTrue(window.waitForExistence(timeout: 5))
        let local = window.descendants(matching: .any)["local-pane"].firstMatch
        XCTAssertTrue(local.wait(until: NSPredicate(format: "value CONTAINS %@ OR label CONTAINS %@", "Start the preview", "Start the preview"), timeout: 5))
        // UI tests leave production alone
        let production = window.descendants(matching: .any)["production-pane"].firstMatch
        XCTAssertTrue(production.wait(until: NSPredicate(format: "value CONTAINS %@ OR label CONTAINS %@", "UI tests", "UI tests"), timeout: 5))
        attachScreenshot(of: window, named: "Data Browser with the preview off")
    }
}
