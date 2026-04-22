import XCTest

class ModuleSISTests: UITestCase {
	func testIsReachableFromHomescreen() throws {
		SISScreen(app: app)
			.navigate()
	}

	// MARK: - Balances (need fresh state)

	func testHasAcknowledgementVisibleByDefault() throws {
		// Relaunch with fresh state to clear any prior "I Agree" acceptance
		relaunchWithFreshState()

		SISScreen(app: app)
			.navigate()
			.checkAcknowledgement()
	}

	func testShowsBalancesAfterAcknowledgement() throws {
		relaunchWithFreshState()

		SISScreen(app: app)
			.navigate()
			.acceptAcknowledgement()
			.checkAcknowledgementDismissed()
			.checkBalancesVisible()
			.checkMealPlanVisible()
	}

	func testContinuesToShowBalancesAfterReopening() throws {
		relaunchWithFreshState()

		SISScreen(app: app)
			.navigate()
			.acceptAcknowledgement()
			.checkBalancesVisible()
			.checkAcknowledgementNotPresent()
			.navigateBack()
			.waitForHomescreenVisible()
			.navigateToSISAgain()
	}

	// MARK: - Tabs

	func testOpenJobsTabCanBeOpened() throws {
		SISScreen(app: app)
			.navigate()
			.openJobsTab()
	}
}
