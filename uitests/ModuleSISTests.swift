import XCTest

class ModuleSISTests: UITestCase {
	// MARK: - Balances
	//
	// setUp launches with --reset-state, so each of these starts before the
	// "I Agree" acknowledgement has been accepted.

	func testHasAcknowledgementVisibleByDefault() throws {
		SISScreen(app: app)
			.navigate()
			.checkAcknowledgement()
	}

	func testShowsBalancesAfterAcknowledgement() throws {
		SISScreen(app: app)
			.navigate()
			.acceptAcknowledgement()
			.checkAcknowledgementDismissed()
			.checkBalancesVisible()
			.checkMealPlanVisible()
	}

	func testContinuesToShowBalancesAfterReopening() throws {
		SISScreen(app: app)
			.navigate()
			.acceptAcknowledgement()
			.checkBalancesVisible()
			.checkAcknowledgementNotPresent()
			.navigateBack()
			.waitForHomescreenVisible()
			.navigateToSISAgain()
			.checkBalancesVisible()
			.checkAcknowledgementNotPresent()
	}
}
