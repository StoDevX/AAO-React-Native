import XCTest

class ModuleSISTests: UITestCase {
	// MARK: - Balances
	//
	// setUp launches with --reset-state, so each of these starts before the
	// "I Agree" acknowledgement has been accepted.

	/// Accepting the acknowledgement shows the balances, and they are still
	/// there, with no acknowledgement, when SIS is opened again.
	func testBalancesShowAfterAcknowledgementAndOnReopening() throws {
		SISScreen(app: app)
			.navigate()
			.acceptAcknowledgement()
			.checkAcknowledgementDismissed()
			.checkBalancesVisible()
			.checkMealPlanVisible()
			.navigateBack()
			.waitForHomescreenVisible()
			.navigateToSISAgain()
			.checkBalancesVisible()
			.checkAcknowledgementNotPresent()
	}
}
