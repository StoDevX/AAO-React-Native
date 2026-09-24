import XCTest

class ModuleSISTests: UITestCase {
	/// Accepting the acknowledgement shows the balances, and they are still
	/// there, with no acknowledgement, when SIS is opened again. setUp launches
	/// with --reset-state, so the test starts before it has been accepted.
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
