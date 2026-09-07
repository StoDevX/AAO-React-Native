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
		// Reset persisted state for every test. Without this, UserDefaults and
		// AsyncStorage carry over between tests in a run, so a test's result can
		// depend on what ran before it -- testLongPressNoticeTogglesDevMode
		// inverts if dev mode is already on, and failed only in long runs.
		app.launchArguments.append(TestIdentifiers.LaunchArguments.resetState)
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

	/// Terminate and relaunch the app at a given Dynamic Type size, passed as
	/// `-UIPreferredContentSizeCategoryName <category>` -- a flag UIKit reads
	/// as a command-line default, the same mechanism `--uitesting` and
	/// `--reset-state` rely on. Lets a test prove a layout at a size larger
	/// than whatever the simulator's own Settings happen to be set to.
	func relaunch(atContentSizeCategory category: String) {
		app.terminate()
		app.launchArguments = [
			TestIdentifiers.LaunchArguments.uiTesting,
			TestIdentifiers.LaunchArguments.resetState,
			"-UIPreferredContentSizeCategoryName", category,
		]
		app.launch()
	}
}
