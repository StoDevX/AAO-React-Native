import XCTest

@MainActor
final class OverviewUITests: XCTestCase {
    /// Moves The Cage's weekday close to 9pm and opens the Overview.
    private func changeTheCageAndOpenTheOverview(in app: XCUIApplication) {
        selectTheCage(in: app)
        let to = currentChanges(in: app).popUpButtons["row-time-to-0-0"]
        XCTAssertTrue(to.waitForExistence(timeout: 10))
        to.click()
        app.menuItems["9:00pm"].click()
        XCTAssertTrue(to.wait(until: NSPredicate(format: "value == %@", "9:00pm"), timeout: 5))
        openOverview(in: app)
        XCTAssertTrue(currentChanges(in: app).staticTexts["building-hours/1-1-cage.yaml"].waitForExistence(timeout: 5))
    }

    func testRevertingAChangeEmptiesTheList() throws {
        let app = try launchWithRepoData().app
        changeTheCageAndOpenTheOverview(in: app)

        XCTAssertTrue(currentChanges(in: app).staticTexts["-       - {days: [Mo, Tu, We, Th, Fr], from: '7:30am', to: '8:00pm'}"].exists)
        XCTAssertTrue(currentChanges(in: app).staticTexts["+       - {days: [Mo, Tu, We, Th, Fr], from: '7:30am', to: '9:00pm'}"].exists)
        attachScreenshot(of: currentChanges(in: app), named: "Overview with The Cage's diff")

        currentChanges(in: app).buttons["revert-building-hours/1-1-cage.yaml"].click()
        let confirm = currentChanges(in: app).buttons["confirm-revert"]
        XCTAssertTrue(confirm.waitForExistence(timeout: 5))
        XCTAssertTrue(currentChanges(in: app).staticTexts["Revert The Cage?"].exists)
        attachScreenshot(of: currentChanges(in: app), named: "Revert asks first")
        confirm.click()

        XCTAssertTrue(currentChanges(in: app).staticTexts["No changes"].waitForExistence(timeout: 5))
        XCTAssertFalse(currentChanges(in: app).buttons["Submit for Review…"].isEnabled)
        attachScreenshot(of: currentChanges(in: app), named: "Overview with no changes after the revert")
    }

    func testSubmittingWithoutAGitHubSignInSaysSo() throws {
        let app = try launchWithRepoData(arguments: ["-UITestGitHubClientID", ""]).app
        changeTheCageAndOpenTheOverview(in: app)

        currentChanges(in: app).buttons["Submit for Review…"].click()
        let summary = currentChanges(in: app).textFields["submit-summary"]
        XCTAssertTrue(summary.waitForExistence(timeout: 5))
        let refusal = NSPredicate(format: "value CONTAINS %@ OR label CONTAINS %@", "can't submit changes", "can't submit changes")
        XCTAssertTrue(currentChanges(in: app).descendants(matching: .any).matching(refusal).firstMatch.exists)
        attachScreenshot(of: currentChanges(in: app), named: "Submit sheet as it opens, with no client ID")

        // a summary alone does not make it submittable
        summary.click()
        summary.typeText("Close The Cage at 9 p.m.")
        XCTAssertFalse(currentChanges(in: app).buttons["submit-confirm"].isEnabled)
        currentChanges(in: app).buttons["Cancel"].click()
        XCTAssertTrue(summary.wait(until: NSPredicate(format: "exists == false"), timeout: 5))
    }

    func testANoticeOfTextNotSavedDoesNotStopSubmitting() throws {
        let (app, data) = try launchWithRepoData()
        selectTheCage(in: app)
        // an edit through the app, so the Overview lists the file; the write below is not one
        let to = currentChanges(in: app).popUpButtons["row-time-to-0-0"]
        XCTAssertTrue(to.waitForExistence(timeout: 10))
        to.click()
        app.menuItems["9:00pm"].click()
        XCTAssertTrue(to.wait(until: NSPredicate(format: "value == %@", "9:00pm"), timeout: 5))
        let title = currentChanges(in: app).textFields["service-title-0"]
        XCTAssertTrue(title.waitForExistence(timeout: 10))
        title.click()
        title.typeKey(.rightArrow, modifierFlags: .command)
        title.typeText(" today")
        // the draft's schedule changes beyond its title, so the draft is let go with a notice
        let cage = data.appending(path: "building-hours/1-1-cage.yaml")
        let yaml = try String(contentsOf: cage, encoding: .utf8)
        try yaml.replacingOccurrences(of: "  - title: Hours\n    notes: The kitchen stops cooking at 8 p.m.\n",
                                      with: "  - title: Open\n    notes: The kitchen stops cooking at 9 p.m.\n")
            .write(to: cage, atomically: true, encoding: .utf8)
        title.typeKey(.return, modifierFlags: [])
        let dismiss = currentChanges(in: app).buttons["dismiss-draft-notice-0"]
        XCTAssertTrue(dismiss.waitForExistence(timeout: 5))

        openOverview(in: app)
        XCTAssertTrue(currentChanges(in: app).buttons["Submit for Review…"].wait(until: NSPredicate(format: "isEnabled == true"), timeout: 5))

        selectTheCage(in: app)
        XCTAssertTrue(dismiss.waitForExistence(timeout: 10))
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

        let current = app.windows["Changesets"].outlines["changeset-list"].staticTexts["Current changes"]
        XCTAssertTrue(current.waitForExistence(timeout: 20))
        attachScreenshot(of: app.windows["Changesets"], named: "Current changes counts the conflict and marks it")
        openOverview(in: app)

        XCTAssertTrue(currentChanges(in: app).staticTexts["The Cage changed on GitHub too. Which version should stay?"].waitForExistence(timeout: 5))
        // a conflict is a change, so the page never says there are none
        XCTAssertFalse(currentChanges(in: app).staticTexts["No changes"].exists)
        currentChanges(in: app).buttons["show-differences-\(file)"].click()
        XCTAssertTrue(currentChanges(in: app).staticTexts["- \(weekdays)"].waitForExistence(timeout: 5))
        XCTAssertTrue(currentChanges(in: app).staticTexts["+       - {days: [Mo, Tu, We, Th, Fr], from: '7:30am', to: '9:00pm'}"].exists)
        attachScreenshot(of: currentChanges(in: app), named: "Conflict with its differences shown")

        currentChanges(in: app).buttons["keep-mine-\(file)"].click()
        XCTAssertTrue(currentChanges(in: app).buttons["revert-\(file)"].waitForExistence(timeout: 5))
        XCTAssertFalse(currentChanges(in: app).buttons["keep-mine-\(file)"].exists)
    }

    func testAConflictBesideAChange() throws {
        let app = try launchWithRepoData(conflicted: "building-hours/1-3-stav.yaml").app
        changeTheCageAndOpenTheOverview(in: app)
        XCTAssertTrue(currentChanges(in: app).buttons["keep-mine-building-hours/1-3-stav.yaml"].exists)
        XCTAssertTrue(currentChanges(in: app).buttons["revert-building-hours/1-1-cage.yaml"].exists)
        attachScreenshot(of: currentChanges(in: app), named: "Overview with a conflict and a change")
    }

    func testLaunchShowsTheChangesetsWindow() throws {
        let app = try launchWithRepoData().app
        let changesets = app.windows["Changesets"]
        XCTAssertTrue(changesets.outlines["changeset-list"].staticTexts["Current changes"].waitForExistence(timeout: 20))
        XCTAssertFalse(changesets.staticTexts["Submitted"].exists)
        XCTAssertTrue(changesets.staticTexts["No changes"].waitForExistence(timeout: 5))
        attachScreenshot(of: changesets, named: "Changesets window at launch")
    }

    /// With nothing changed, the Changesets window's Overview offers the way into the editor.
    func testNoChangesOffersTheEditor() throws {
        let app = try launchWithRepoData().app
        let changesets = app.windows["Changesets"]
        let edit = changesets.buttons["Edit Building Hours"]
        XCTAssertTrue(edit.waitForExistence(timeout: 20))
        attachScreenshot(of: changesets, named: "No changes, with the way into the editor")
        edit.click()
        XCTAssertTrue(currentChangesWindow(in: app).waitForExistence(timeout: 5))
        // its own window lists the buildings beside the Overview, so it has no need of the button
        XCTAssertFalse(currentChangesWindow(in: app).buttons["Edit Building Hours"].exists)
    }

    func testOpeningCurrentChangesBringsItsWindow() throws {
        let app = try launchWithRepoData().app
        let window = openCurrentChanges(in: app)
        let buildings = window.outlines["building-list"]
        XCTAssertTrue(buildings.staticTexts["Overview"].exists)
        XCTAssertTrue(buildings.staticTexts["The Cage"].waitForExistence(timeout: 5))
        XCTAssertTrue(window.staticTexts["No changes"].exists)
        attachScreenshot(of: window, named: "Current changes window on its Overview")
    }

    /// Text still being typed in Current changes shows on the Changesets window's Overview too.
    func testTheChangesetsOverviewShowsTextBeingTyped() throws {
        let app = try launchWithRepoData().app
        let window = openCurrentChanges(in: app)
        window.outlines["building-list"].staticTexts["The Cage"].click()
        let title = window.textFields["service-title-0"]
        XCTAssertTrue(title.waitForExistence(timeout: 10))
        title.click()
        title.typeKey(.rightArrow, modifierFlags: .command)
        // no Return
        title.typeText(" today")
        app.typeKey("0", modifierFlags: .command)
        let changesets = app.windows["Changesets"]
        let typed = NSPredicate(format: "value CONTAINS %@ OR label CONTAINS %@", "title: Hours today", "title: Hours today")
        XCTAssertTrue(changesets.descendants(matching: .any).matching(typed).firstMatch.waitForExistence(timeout: 10))
        attachScreenshot(of: changesets, named: "Changesets window showing text typed in Current changes")
    }

    /// Return opens the chosen changeset, as a double-click does, and Submit does not take it.
    func testReturnInTheChangesetsListOpensTheChangeset() throws {
        let app = try launchWithRepoData().app
        let current = app.windows["Changesets"].outlines["changeset-list"].staticTexts["Current changes"]
        XCTAssertTrue(current.waitForExistence(timeout: 20))
        current.click()
        app.typeKey(.return, modifierFlags: [])
        XCTAssertTrue(currentChangesWindow(in: app).waitForExistence(timeout: 5))
    }

    /// A problem in The Cage, followed from the Changesets window, opens The Cage to edit.
    func testShowingABuildingFromTheChangesetsWindow() throws {
        let app = try launchWithRepoData().app
        let window = openCurrentChanges(in: app)
        window.outlines["building-list"].staticTexts["The Cage"].click()
        let title = window.textFields["service-title-0"]
        XCTAssertTrue(title.waitForExistence(timeout: 10))
        title.click()
        title.typeKey("a", modifierFlags: .command)
        title.typeKey(.delete, modifierFlags: [])
        title.typeKey(.return, modifierFlags: [])
        XCTAssertTrue(window.staticTexts["The title can't be empty."].waitForExistence(timeout: 5))
        window.outlines["building-list"].staticTexts["Stav Hall"].click()

        let changesets = app.windows["Changesets"]
        // ⌘0 brings it back in front of Current changes, which opened over it
        app.typeKey("0", modifierFlags: .command)
        let show = changesets.buttons["Show The Cage"]
        XCTAssertTrue(show.waitForExistence(timeout: 10))
        attachScreenshot(of: changesets, named: "Changesets window naming the building that stops the preview")
        show.click()
        XCTAssertTrue(window.staticTexts["The title can't be empty."].waitForExistence(timeout: 5))
    }

    func testTheDataBrowserAsksForThePreviewWhileItIsOff() throws {
        let app = try launchWithRepoData().app
        let browse = openCurrentChanges(in: app).buttons["Data Browser"]
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
