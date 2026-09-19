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

		// Before the app launches: a run with no known JS source measures
		// whatever is on 8081, which may be another checkout entirely.
		try requireKnownJsSource()

		app = XCUIApplication()
		app.launchArguments.append(TestIdentifiers.LaunchArguments.uiTesting)
		// Reset persisted state for every test. Without this, UserDefaults and
		// AsyncStorage carry over between tests in a run, so a test's result can
		// depend on what ran before it -- testLongPressNoticeTogglesDevMode
		// inverts if dev mode is already on, and failed only in long runs.
		app.launchArguments.append(TestIdentifiers.LaunchArguments.resetState)
		appendJsLocationIfProvided()
		app.launch()
	}

	/// Release the latch when the test that set it turns out to have passed.
	///
	/// `-retry-tests-on-failure` re-runs a failed test in this same process, so
	/// a failure recorded on one attempt is not a failure of the run. Without
	/// this, a rescued flake skips every test after it and the shard reports
	/// green having run almost nothing.
	override func tearDownWithError() throws {
		if (testRun?.failureCount ?? 0) > 0 {
			captureFailureScreen()
		}

		if UITestCase.failedTest == name, testRun?.failureCount == 0 {
			UITestCase.failedTest = nil
		}
	}

	/// Attach a screenshot of wherever the app ended up, for a test that failed.
	///
	/// `continueAfterFailure` is false, so a failed test stops at its assertion
	/// and the screen is still whatever the assertion was unhappy about --
	/// which is the one picture worth having and the one nobody thinks to take
	/// in advance. Xcode's own automatic screenshots need a test plan this
	/// project does not have, and the scheme defaults throw them away.
	///
	/// `.keepAlways` rather than `.deleteOnSuccess`: this only runs for a
	/// failure, so there is no success for the latter to key off, and CI's
	/// "Extract failure attachments" step reads whatever is in the bundle.
	private func captureFailureScreen() {
		let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
		attachment.name = "Failure - \(name)"
		attachment.lifetime = .keepAlways
		add(attachment)
	}

	/// Points the app at a Metro other than the default localhost:8081, when
	/// the test runner was started with `TEST_RUNNER_AAO_JS_LOCATION=host:port`.
	/// `-RCT_jsLocation` is read by React Native as a command-line default;
	/// without it, a Metro that some other checkout left on 8081 would serve
	/// this app someone else's JavaScript.
	func appendJsLocationIfProvided() {
		if let location = ProcessInfo.processInfo.environment["AAO_JS_LOCATION"] {
			app.launchArguments.append(contentsOf: ["-RCT_jsLocation", location])
		}
	}

	/// Refuses to run a test whose JavaScript could come from anywhere.
	///
	/// A Debug build with no embedded bundle asks `localhost:8081` and takes
	/// whatever answers. On a machine running several checkouts that is
	/// whichever one started Metro first, so the suite silently measures
	/// another branch's code -- a run that can go green or red for reasons
	/// that have nothing to do with the diff under test. With nothing on 8081
	/// it instead fails at the first screen, which reads as a launch flake and
	/// invites a retry loop.
	///
	/// Both failures are worse than not running, so this stops the suite
	/// before a single test does. One of two things has to be true:
	///
	/// - `TEST_RUNNER_AAO_JS_LOCATION=localhost:<port>` names a Metro, or
	/// - the built `.app` carries a `main.jsbundle`, which is how CI runs.
	///
	/// The second is checked rather than declared. `xcodebuild` hands the
	/// runner the host path to its build products in
	/// `__XCODE_BUILT_PRODUCTS_DIR_PATHS`, and a simulator process can read
	/// the host filesystem, so the bundle can simply be looked for. A flag
	/// saying "a bundle is embedded" would be one more thing that can be wrong.
	private func requireKnownJsSource() throws {
		if ProcessInfo.processInfo.environment["AAO_JS_LOCATION"] != nil {
			return
		}
		if Self.builtAppHasEmbeddedBundle() {
			return
		}
		throw UnknownJsSource()
	}

	/// Whether the `.app` this run installs carries its JavaScript inside it.
	///
	/// Returns false when the products directory cannot be found or read,
	/// which is the safe answer: without a Metro declared, a run that cannot
	/// prove it has a bundle is the run this guard exists to stop.
	private static func builtAppHasEmbeddedBundle() -> Bool {
		guard
			let products = ProcessInfo.processInfo.environment["__XCODE_BUILT_PRODUCTS_DIR_PATHS"]?
				.split(separator: ":").first.map(String.init)
		else {
			return false
		}

		let fileManager = FileManager.default
		// Found by extension rather than by name, so renaming the app or
		// adding a variant does not quietly disable the check.
		let apps = ((try? fileManager.contentsOfDirectory(atPath: products)) ?? [])
			.filter { $0.hasSuffix(".app") }

		return apps.contains { app in
			fileManager.fileExists(atPath: "\(products)/\(app)/main.jsbundle")
		}
	}

	/// Thrown, not skipped: a skipped suite exits 0 and reads as "nothing to
	/// do", which is how a misconfigured run gets mistaken for a clean one.
	/// A thrown error fails the test, and the fail-fast latch above turns that
	/// into a non-zero exit before any other test runs.
	struct UnknownJsSource: Error, CustomStringConvertible {
		var description: String {
			"""
			No Metro was named and the built .app carries no main.jsbundle, so \
			this run would ask localhost:8081 and take whatever answers -- \
			possibly another checkout's Metro, whose results would say nothing \
			about this branch.

			Either point it at a Metro serving THIS worktree:
			  TEST_RUNNER_AAO_JS_LOCATION=localhost:<port> xcodebuild ...
			or embed a bundle in the .app, which is how CI runs.

			The TEST_RUNNER_ prefix is required: xcodebuild silently drops \
			environment variables without it, so a bare AAO_JS_LOCATION never \
			reaches this process and the run looks configured while it is not. \
			Prefer the run-uitests skill, which handles this.
			"""
		}
	}

	/// Terminate and relaunch the app with `--reset-state` to clear persisted
	/// data (AsyncStorage, UserDefaults).
	func relaunchWithFreshState() {
		app.terminate()
		app.launchArguments = [
			TestIdentifiers.LaunchArguments.uiTesting,
			TestIdentifiers.LaunchArguments.resetState,
		]
		appendJsLocationIfProvided()
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
		appendJsLocationIfProvided()
		app.launch()
	}
}
