import XCTest

/// Base class for all UI tests. Provides common setup (launch arguments,
/// `continueAfterFailure = false`) so individual test files stay focused
/// on assertions.
class UITestCase: XCTestCase {
	var app: XCUIApplication!

	/// The test that failed, once one has, as `-[Class method]`.
	///
	/// A shard that has already failed cannot go green, so every test after the
	/// failure only adds wall-clock: each one cold-launches the app, and a full
	/// shard runs about twenty-five minutes. Reporting the failure sooner is
	/// worth more than the results of tests nobody will read until it is fixed.
	private static var failedTest: String?

	override func record(_ issue: XCTIssue) {
		// `isFailure` rather than the issue's type: a skip arrives here as an
		// issue too, and treating one as a failure would let the first skipped
		// test stand in for the failure that caused it. XCTest documents this
		// property as the way to ask the question, over reading `severity`.
		if issue.isFailure {
			UITestCase.failedTest = name
		}
		super.record(issue)
	}

	override func setUpWithError() throws {
		// Only bail once a *different* test has failed. `-retry-tests-on-failure`
		// re-runs a failing test in this same process, and those repetitions
		// carry the same `name` -- skipping them would turn the retry the CI
		// step relies on into a no-op, and a launch flake back into a failure.
		if let failed = UITestCase.failedTest, failed != name {
			throw XCTSkip("\(failed) failed; skipping the rest of this run so it reports sooner")
		}

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
