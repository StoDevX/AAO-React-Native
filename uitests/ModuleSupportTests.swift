import XCTest

class ModuleSupportTests: UITestCase {
	/// Feedback in Home's menu opens the problem form, and closing it returns
	/// home. Support then offers every row, opens each of its screens, and its
	/// own Send Feedback opens the same form.
	func testFeedbackAndSupportOpenTheirScreens() throws {
		let home = HomeScreen(app: app).checkHomescreenExists()
		home.chooseFromHomeMenu(TestIdentifiers.Navigation.feedbackMenuItem)
		XCTAssertTrue(
			app.navigationBars[TestIdentifiers.Support.reportProblemTitle].waitForExistence(timeout: 30),
			"Feedback should open the Report a Problem form")
		home.closeProblemForm().checkHomescreenExists()

		let support = home.openSupport()
		support.checkOffersEveryRow().capture("support")

		let backButton = app.navigationBars.buttons[TestIdentifiers.Navigation.systemBackButton].firstMatch
		let ids = TestIdentifiers.Support.self
		let screens: [(row: String, mounted: XCUIElement)] = [
			(ids.faqs, app.navigationBars[ids.faqs]),
		]
		for (row, mounted) in screens {
			support.open(row, mountedWhen: mounted)
			backButton.tap()
			XCTAssertTrue(support.host.waitForExistence(timeout: 10), "Back should return to Support")
		}

		support
			.open(ids.sendFeedback, mountedWhen: app.navigationBars[ids.reportProblemTitle])
			.closeProblemForm()
		XCTAssertTrue(support.host.waitForExistence(timeout: 10), "Closing the form should return to Support")
	}
}
