import XCTest

struct SISScreen: Screen {
	let app: XCUIApplication

	@discardableResult
	func navigate() -> Self {
		navigateFromHome(to: TestIdentifiers.Buttons.sis)
	}

	@discardableResult
	func checkAcknowledgement() -> Self {
		let iAgree = app.buttons[TestIdentifiers.SIS.iAgree].firstMatch
		XCTAssertTrue(
			iAgree.waitForExistence(timeout: 30),
			"I Agree acknowledgement should be visible")
		return self
	}

	@discardableResult
	func acceptAcknowledgement() -> Self {
		let iAgree = app.buttons[TestIdentifiers.SIS.iAgree].firstMatch
		XCTAssertTrue(
			iAgree.waitForExistence(timeout: 30),
			"I Agree acknowledgement should be visible")
		iAgree.tap()
		return self
	}

	@discardableResult
	func checkAcknowledgementDismissed() -> Self {
		let iAgree = app.buttons[TestIdentifiers.SIS.iAgree].firstMatch
		XCTAssertTrue(
			iAgree.waitForNonExistence(timeout: 10),
			"I Agree should be hidden after tapping")
		return self
	}

	@discardableResult
	func checkAcknowledgementNotPresent() -> Self {
		let iAgree = app.buttons[TestIdentifiers.SIS.iAgree].firstMatch
		XCTAssertFalse(
			iAgree.exists,
			"I Agree should be hidden after tapping")
		return self
	}

	@discardableResult
	func checkBalancesVisible() -> Self {
		let balances = app.staticTexts[TestIdentifiers.SIS.balancesHeader].firstMatch
		XCTAssertTrue(
			balances.waitForExistence(timeout: 30),
			"BALANCES should be visible")
		return self
	}

	@discardableResult
	func checkMealPlanVisible() -> Self {
		let mealPlan = app.staticTexts[TestIdentifiers.SIS.mealPlanHeader].firstMatch
		XCTAssertTrue(
			mealPlan.waitForExistence(timeout: 30),
			"MEAL PLAN should be visible")
		return self
	}

	/// Leaves SIS via the navigation bar's back button, scoped to that bar and
	/// queried by UIKit's identifier rather than its label: every back button
	/// in the app reads `Back`, so the label says nothing about which one.
	@discardableResult
	func navigateBack() -> Self {
		let backButton = app.navigationBars[TestIdentifiers.Buttons.sis]
			.buttons[TestIdentifiers.Navigation.systemBackButton]
		XCTAssertTrue(
			backButton.waitForExistence(timeout: 10),
			"SIS should offer a back button to leave by")
		backButton.tap()
		return self
	}

	@discardableResult
	func waitForHomescreenVisible() -> Self {
		let homescreen = app.element(matching: TestIdentifiers.Home.screen)
		XCTAssertTrue(
			homescreen.waitForExistence(timeout: 30),
			"Leaving SIS should land back on the homescreen")
		return self
	}

	@discardableResult
	func navigateToSISAgain() -> Self {
		let homescreen = app.element(matching: TestIdentifiers.Home.screen)
		app.buttons[TestIdentifiers.Buttons.sis].firstMatch.tap()
		XCTAssertTrue(
			homescreen.waitForNonExistence(timeout: 30),
			"Reopening SIS should leave the homescreen")
		return self
	}

	@discardableResult
	func openJobsTab() -> Self {
		let openJobs = app.tabButton(TestIdentifiers.SIS.openJobs)
		XCTAssertTrue(openJobs.waitForExistence(timeout: 30))
		openJobs.tap()
		return self
	}

	/// Opens a fixture posting by its title, which leads its row's label.
	@discardableResult
	func openJobPosting(_ title: String) -> Self {
		let job = app.elementWithLabel(startingWith: title)
		XCTAssertTrue(job.waitForExistence(timeout: 30), "Open Jobs should list \(title)")
		job.tap()
		// The posting's own title, not a row in it: a form builds rows only as
		// they near the screen, so its last rows may not exist yet.
		XCTAssertTrue(
			app.navigationBars[title].waitForExistence(timeout: 30),
			"Tapping \(title) should open its posting")
		return self
	}

	@discardableResult
	func checkJobsSiteLinkIsExternal() -> Self {
		XCTAssertTrue(
			jobsSiteLink.images[TestIdentifiers.SIS.externalLinkAccessory].exists,
			"The jobs-site link should carry the up-right arrow of a link that leaves the app")
		return self
	}

	/// A slow drag across the fields, so it scrolls them by about its own
	/// length rather than flinging.
	@discardableResult
	func dragJobPostingFieldsUp() -> Self {
		let start = app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.8))
		let end = app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.2))
		start.press(forDuration: 0.1, thenDragTo: end, withVelocity: .slow, thenHoldForDuration: 0.5)
		return self
	}

	@discardableResult
	func checkJobsSiteLinkReachable() -> Self {
		XCTAssertLessThan(
			jobsSiteLink.frame.maxY, app.frame.height,
			"Scrolling the fields should bring the jobs-site link fully on screen")
		XCTAssertTrue(jobsSiteLink.isHittable, "The jobs-site link should be tappable")
		return self
	}

	@discardableResult
	func openJobDescription() -> Self {
		let row = app.buttonLabelled(TestIdentifiers.SIS.jobDescriptionRow)
		// Scrolled to until tappable, not merely present: a form builds rows
		// before they are on screen.
		for _ in 0..<6 where !row.isHittable {
			app.swipeUp()
		}
		XCTAssertTrue(row.isHittable, "The posting should offer its description as a row")
		row.tap()
		return self
	}

	@discardableResult
	func checkJobDescriptionShown() -> Self {
		XCTAssertTrue(
			app.navigationBars[TestIdentifiers.SIS.jobDescriptionRow].waitForExistence(timeout: 10),
			"The description should open on a screen of its own")
		XCTAssertTrue(
			app.elementWithLabel(startingWith: TestIdentifiers.SIS.fixtureJobDescriptionParagraph)
				.waitForExistence(timeout: 10),
			"The description screen should hold the posting's text")
		return self
	}

	private var jobsSiteLink: XCUIElement {
		app.linkLabelled(TestIdentifiers.SIS.jobsSiteLink)
	}
}
