import XCTest

/// Base class for all UI tests. Provides common setup (launch arguments,
/// `continueAfterFailure = false`) so individual test files stay focused
/// on assertions.
class UITestCase: XCTestCase {
	var app: XCUIApplication!

	override func setUp() {
		continueAfterFailure = false

		app = XCUIApplication()
		app.launchArguments.append(TestIdentifiers.LaunchArguments.uiTesting)
		app.launch()
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
