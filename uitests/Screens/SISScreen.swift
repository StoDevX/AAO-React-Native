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
	/// queried by UIKit's identifier. The label is no use here: every back
	/// button reads `Back`, and this one used to read the previous screen's
	/// title instead.
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
}
