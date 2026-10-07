import XCTest

/// `isStoprintMocked` follows `isUITesting`, so a UI-test launch is served from
/// `__mocks__` rather than PaperCut. That is what lets these tests reach a job
/// list at all, and it is also why the signed-out notice is unreachable here:
/// the mocked launch never asks for an account. That branch is covered by
/// `printJobsGate` in source/features/stoprint/__tests__/print-jobs-gate.test.ts,
/// which can state the mocked and unmocked cases alike.
class ModuleStoPrintTests: UITestCaseUnbooted {

	/// The job list, then a pending job released through the printer list.
	///
	/// The release screen with its actions available, which is a different
	/// state: a job already sent has nothing left to print or cancel, so those
	/// rows are drawn only when one is pending and a printer has been chosen.
	///
	/// Choosing a printer means passing through the printer list, which only
	/// a Pending Release job's row pushes to; every other status goes straight
	/// to the release screen.
	///
	/// So first a job already sent, "test.pdf" in the fixtures, opens the
	/// release screen with nothing to choose.
	func testAPendingJobReleasesThroughThePrinterList() throws {
		let screen = StoPrintScreen(app: app).navigate()

		// A section header from the mocked jobs, so the capture waits for the
		// list rather than the spinner that precedes it.
		let pendingRelease = app.staticTexts["Pending Release"].firstMatch
		XCTAssertTrue(
			pendingRelease.waitUntilExists(timeout: 30),
			"Print Jobs should list the mocked jobs")

		screen.capture("Print Jobs")

		let sent = app.buttons
			.matching(NSPredicate(format: "label BEGINSWITH %@", "test.pdf"))
			.firstMatch
		XCTAssertTrue(sent.waitUntilExists(timeout: 30), "A sent job should be listed")
		sent.tap()
		XCTAssertTrue(
			app.staticTexts["Job Info"].firstMatch.waitUntilExists(timeout: 30),
			"A sent job should open the release screen")
		screen.capture("Print release").goBack()

		let job = app.buttons
			.matching(NSPredicate(format: "label BEGINSWITH %@", "IMG_2259-COLLAGE.jpg"))
			.firstMatch
		XCTAssertTrue(job.waitUntilExists(timeout: 30), "A pending job should be listed")
		job.tap()

		// Every printer in the fixtures is named mfc-<something>; their location
		// is blank, so a row is its name alone.
		let printer = app.buttons
			.matching(NSPredicate(format: "label BEGINSWITH %@", "mfc-"))
			.firstMatch
		XCTAssertTrue(printer.waitUntilExists(timeout: 30), "A printer should be listed")
		screen.capture("Printers")
		printer.tap()

		let print = app.buttons["Print"].firstMatch
		XCTAssertTrue(print.waitUntilExists(timeout: 30), "Print should be offered")

		screen.capture("Print release - actions")
	}
}
