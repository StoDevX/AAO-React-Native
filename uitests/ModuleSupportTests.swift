import XCTest

class ModuleSupportTests: UITestCase {
	func testHomeMenuOffersHelpAndFeedback() throws {
		let home = HomeScreen(app: app).checkHomescreenExists().openHomeMenu()
		let nav = TestIdentifiers.Navigation.self
		for item in [nav.supportMenuItem, nav.aboutMenuItem, "Contributing", nav.feedbackMenuItem] {
			XCTAssertTrue(
				app.buttons[item].firstMatch.waitForExistence(timeout: 10),
				"Home menu should offer \(item)")
		}
		home.capture("home-menu")
	}

	func testSupportOpensEachOfItsScreens() throws {
		let support = HomeScreen(app: app).checkHomescreenExists().openSupport()
		support.checkOffersEveryRow().capture("support")

		let backButton = app.navigationBars.buttons[TestIdentifiers.Navigation.systemBackButton].firstMatch
		let ids = TestIdentifiers.Support.self
		let screens: [(row: String, mounted: XCUIElement)] = [
			(ids.faqs, app.navigationBars[ids.faqs]),
			(ids.notices, app.navigationBars[ids.notices]),
			(ids.emergencyContacts, app.navigationBars["Contacts"]),
		]
		for (row, mounted) in screens {
			support.open(row, mountedWhen: mounted)
			backButton.tap()
			XCTAssertTrue(support.host.waitForExistence(timeout: 10), "Back should return to Support")
		}
	}

	func testSupportSendFeedbackOpensTheProblemForm() throws {
		let support = HomeScreen(app: app).checkHomescreenExists().openSupport()
		support.open(
			TestIdentifiers.Support.sendFeedback,
			mountedWhen: app.navigationBars[TestIdentifiers.Support.reportProblemTitle])
		closeProblemForm()
		XCTAssertTrue(
			app.element(matching: TestIdentifiers.Support.screen).waitForExistence(timeout: 10),
			"Closing the form should return to Support")
	}

	func testHomeMenuFeedbackOpensTheProblemForm() throws {
		HomeScreen(app: app).checkHomescreenExists()
			.chooseFromHomeMenu(TestIdentifiers.Navigation.feedbackMenuItem)
		XCTAssertTrue(
			app.navigationBars[TestIdentifiers.Support.reportProblemTitle].waitForExistence(timeout: 30),
			"Feedback should open the Report a Problem form")
		closeProblemForm()
		HomeScreen(app: app).checkHomescreenExists()
	}

	/// Close Report a Problem with its own close button, and wait for it to go.
	private func closeProblemForm() {
		let close = app.buttons[TestIdentifiers.Support.closeProblemForm].firstMatch
		XCTAssertTrue(close.waitForExistence(timeout: 10), "Report a Problem should have a close button")
		close.tap()
		XCTAssertTrue(
			app.navigationBars[TestIdentifiers.Support.reportProblemTitle].waitForNonExistence(timeout: 10),
			"Report a Problem should close")
	}
}
