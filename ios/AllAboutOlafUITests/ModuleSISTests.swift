import XCTest

class ModuleSISTests: XCTestCase {
	private var app: XCUIApplication!

	override func setUpWithError() throws {
		continueAfterFailure = false
		app = XCUIApplication()
		app.launch()
	}

	func testIsReachableFromHomescreen() throws {
		let homescreen = app.element(matching: "screen-homescreen")
		XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

		app.buttons["SIS"].firstMatch.tap()

		XCTAssertTrue(homescreen.waitForNonExistence(timeout: 30))
	}

	// MARK: - Balances (need fresh state)

	func testHasAcknowledgementVisibleByDefault() throws {
		// Relaunch with fresh state to clear any prior "I Agree" acceptance
		app.terminate()
		app.launchArguments = ["--reset-state"]
		app.launch()

		app.buttons["SIS"].firstMatch.tap()

		let homescreen = app.element(matching: "screen-homescreen")
		XCTAssertTrue(homescreen.waitForNonExistence(timeout: 30))

		let iAgree = app.buttons["I Agree"].firstMatch
		XCTAssertTrue(iAgree.waitForExistence(timeout: 30),
		              "I Agree acknowledgement should be visible")
	}

	func testShowsBalancesAfterAcknowledgement() throws {
		app.terminate()
		app.launchArguments = ["--reset-state"]
		app.launch()

		app.buttons["SIS"].firstMatch.tap()

		let iAgree = app.buttons["I Agree"].firstMatch
		XCTAssertTrue(iAgree.waitForExistence(timeout: 30))
		iAgree.tap()

		XCTAssertFalse(iAgree.exists,
		               "I Agree should be hidden after tapping")

		let balances = app.staticTexts["BALANCES"].firstMatch
		XCTAssertTrue(balances.waitForExistence(timeout: 30),
		              "BALANCES should be visible")

		let mealPlan = app.staticTexts["MEAL PLAN"].firstMatch
		XCTAssertTrue(mealPlan.waitForExistence(timeout: 30),
		              "MEAL PLAN should be visible")
	}

	func testContinuesToShowBalancesAfterReopening() throws {
		app.terminate()
		app.launchArguments = ["--reset-state"]
		app.launch()

		app.buttons["SIS"].firstMatch.tap()

		let iAgree = app.buttons["I Agree"].firstMatch
		XCTAssertTrue(iAgree.waitForExistence(timeout: 30))
		iAgree.tap()

		let balances = app.staticTexts["BALANCES"].firstMatch
		XCTAssertTrue(balances.waitForExistence(timeout: 30))

		XCTAssertFalse(iAgree.exists)

		// Return to the home screen
		let backButton = app.buttons["All About Olaf"].firstMatch
		XCTAssertTrue(backButton.waitForExistence(timeout: 10))
		backButton.tap()

		let homescreen = app.element(matching: "screen-homescreen")
		XCTAssertTrue(homescreen.waitForExistence(timeout: 30))

		// Navigate back into SIS
		app.buttons["SIS"].firstMatch.tap()
		XCTAssertTrue(homescreen.waitForNonExistence(timeout: 30))
	}

	// MARK: - Tabs

	func testOpenJobsTabCanBeOpened() throws {
		app.buttons["SIS"].firstMatch.tap()

		let openJobs = app.tabButton("Open Jobs")
		XCTAssertTrue(openJobs.waitForExistence(timeout: 30))
		openJobs.tap()
	}
}
