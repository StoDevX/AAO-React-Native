import XCTest

/// Base class for all UI tests. Provides common setup (launch arguments,
/// `continueAfterFailure = false`) so individual test files stay focused
/// on assertions.
///
/// **Why XCTest instead of Swift Testing?**
/// Apple's Swift Testing framework does not yet support UI tests
/// (`XCUIApplication`, `XCUIElement`). When that changes, only this base
/// class and the Screen objects will need updating — the 18 test files
/// use a fluent Screen-object API that isolates all XCTest dependencies.
@MainActor
class UITestCase: XCTestCase {
	var app: XCUIApplication!

	override func setUp() {
		continueAfterFailure = false

		app = XCUIApplication()
		app.launchArguments.append(TestIdentifiers.LaunchArguments.uiTesting)
		app.launch()
	}

	override func tearDown() {
		if let failureCount = testRun?.failureCount, failureCount > 0 {
			let screenshot = XCUIScreen.main.screenshot()
			let attachment = XCTAttachment(screenshot: screenshot)
			attachment.name = "Failure Screenshot"
			attachment.lifetime = .keepAlways
			add(attachment)
		}
		super.tearDown()
	}

	/// Terminate and relaunch the app with `--reset-state` to clear persisted
	/// data (AsyncStorage, UserDefaults).
	func relaunchWithFreshState() {
		app.terminate()
		app.launchArguments = [
			TestIdentifiers.LaunchArguments.uiTesting,
			TestIdentifiers.LaunchArguments.resetState,
		]
		app.launch()
	}
}
