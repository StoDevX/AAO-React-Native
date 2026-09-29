import XCTest

class ModuleSISTests: UITestCase {
	/// Accepting the acknowledgement shows the balances, and they are still
	/// there, with no acknowledgement, when SIS is opened again. setUp launches
	/// with --reset-state, so the test starts before it has been accepted.
	func testBalancesShowAfterAcknowledgementAndOnReopening() throws {
		// The native SIS tile is turned off in source/features/views.ts, and
		// Balances opens sis.stolaf.edu in a browser instead, so nothing on the
		// home screen leads to the screen this drives.
		try XCTSkipIf(true, "The native SIS tile is turned off; Balances opens SIS on the web")
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
