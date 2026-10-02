import XCTest

class ModuleBalancesTests: UITestCaseUnbooted {
	/// Accepting the acknowledgement shows the balances, and they are still
	/// there, with no acknowledgement, when Balances is opened again. setUp
	/// launches with --reset-state, so the test starts before it has been
	/// accepted.
	func testBalancesShowAfterAcknowledgementAndOnReopening() throws {
		// The native Balances tile is turned off in source/features/views.ts,
		// and the Balances tile that is on opens sis.stolaf.edu in a browser,
		// so nothing on the home screen leads to the screen this drives.
		try XCTSkipIf(true, "The native Balances tile is turned off; Balances opens SIS on the web")
		BalancesScreen(app: app)
			.navigate()
			.acceptAcknowledgement()
			.checkAcknowledgementDismissed()
			.checkBalancesVisible()
			.checkMealPlanVisible()
			.navigateBack()
			.waitForHomescreenVisible()
			.navigateToBalancesAgain()
			.checkBalancesVisible()
			.checkAcknowledgementNotPresent()
	}
}
