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
		assertExists(iAgree, "I Agree acknowledgement should be visible")
		return self
	}

	@discardableResult
	func acceptAcknowledgement() -> Self {
		let iAgree = app.buttons[TestIdentifiers.SIS.iAgree].firstMatch
		assertExists(iAgree, "I Agree acknowledgement should be visible")
		iAgree.tap()
		return self
	}

	@discardableResult
	func checkAcknowledgementDismissed() -> Self {
		let iAgree = app.buttons[TestIdentifiers.SIS.iAgree].firstMatch
		assertNotExists(iAgree, timeout: 10, "I Agree should be hidden after tapping")
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
		assertExists(balances, "BALANCES should be visible")
		return self
	}

	@discardableResult
	func checkMealPlanVisible() -> Self {
		let mealPlan = app.staticTexts[TestIdentifiers.SIS.mealPlanHeader].firstMatch
		assertExists(mealPlan, "MEAL PLAN should be visible")
		return self
	}

	@discardableResult
	func navigateBack() -> Self {
		let backButton = app.buttons[TestIdentifiers.SIS.backButton].firstMatch
		assertExists(backButton, timeout: 10, "Back button should be visible")
		backButton.tap()
		return self
	}

	@discardableResult
	func waitForHomescreenVisible() -> Self {
		let homescreen = app.element(matching: TestIdentifiers.Home.screen)
		assertExists(homescreen, "Home screen should be visible after navigating back")
		return self
	}

	@discardableResult
	func navigateToSISAgain() -> Self {
		let homescreen = app.element(matching: TestIdentifiers.Home.screen)
		app.buttons[TestIdentifiers.Buttons.sis].firstMatch.tap()
		assertNotExists(homescreen, "Home screen should disappear after tapping SIS")
		return self
	}

	@discardableResult
	func openJobsTab() -> Self {
		let openJobs = app.tabButton(TestIdentifiers.SIS.openJobs)
		assertExists(openJobs, "Open Jobs tab should be visible")
		openJobs.tap()
		return self
	}
}
