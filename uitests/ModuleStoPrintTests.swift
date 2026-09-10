import XCTest

class ModuleStoPrintTests: UITestCase {
	func testIsReachableFromHomescreen() throws {
		StoPrintScreen(app: app)
			.navigate()
	}

	// The signed-out notice is no longer reachable here: `isStoprintMocked`
	// follows `isUITesting`, so a UI-test launch is served from `__mocks__` and
	// never asks for an account. That branch is now covered by `printJobsGate`
	// in source/features/stoprint/__tests__/print-jobs-gate.test.ts, which can
	// state the mocked and unmocked cases alike.
}
