import XCTest

/// `isStoprintMocked` follows `isUITesting`, so a UI-test launch is served from
/// `__mocks__` rather than PaperCut. That is what lets these tests reach a job
/// list at all, and it is also why the signed-out notice is unreachable here:
/// the mocked launch never asks for an account. That branch is covered by
/// `printJobsGate` in source/features/stoprint/__tests__/print-jobs-gate.test.ts,
/// which can state the mocked and unmocked cases alike.
class ModuleStoPrintTests: UITestCase {

	func testPrintJobsList() throws {
		let screen = StoPrintScreen(app: app).navigate()

		// A section header from the mocked jobs, so the capture waits for the
		// list rather than the spinner that precedes it.
		let pendingRelease = app.staticTexts["Pending Release"].firstMatch
		XCTAssertTrue(
			pendingRelease.waitForExistence(timeout: 30),
			"Print Jobs should list the mocked jobs")

		screen.capture("Print Jobs")
	}

	/// Reaching the printer list means releasing a job, so this taps a mocked
	/// job that is Pending Release -- the only status whose row pushes here
	/// rather than to the release screen.
	func testPrinterList() throws {
		let screen = StoPrintScreen(app: app).navigate()

		let job = app.buttons
			.matching(NSPredicate(format: "label BEGINSWITH %@", "IMG_2259-COLLAGE.jpg"))
			.firstMatch
		XCTAssertTrue(job.waitForExistence(timeout: 30), "A pending-release job should be listed")
		job.tap()

		// Every printer in the fixtures is named mfc-<something>; their location
		// is blank, so a row is its name alone.
		let anyPrinter = app.buttons
			.matching(NSPredicate(format: "label BEGINSWITH %@", "mfc-"))
			.firstMatch
		XCTAssertTrue(anyPrinter.waitForExistence(timeout: 30), "The printer list should be shown")

		screen.capture("Printers")
	}

	/// A job that is not pending release goes to the release screen rather than
	/// the printer picker, which is the screen this reaches.
	func testPrintReleaseScreen() throws {
		let screen = StoPrintScreen(app: app).navigate()

		// "test.pdf" is Sent to Printer in the fixtures, so tapping it opens the
		// release screen; a Pending Release job would open the printer list.
		let job = app.buttons
			.matching(NSPredicate(format: "label BEGINSWITH %@", "test.pdf"))
			.firstMatch
		XCTAssertTrue(job.waitForExistence(timeout: 30), "A sent job should be listed")
		job.tap()

		let jobInfo = app.staticTexts["JOB INFO"].firstMatch
		XCTAssertTrue(jobInfo.waitForExistence(timeout: 30), "The release screen should be shown")

		screen.capture("Print release")
	}

	/// The release screen with its actions available, which is a different
	/// state: a job already sent has nothing left to print or cancel, so those
	/// rows are drawn only when one is pending and a printer has been chosen.
	func testPrintReleaseActions() throws {
		let screen = StoPrintScreen(app: app).navigate()

		let job = app.buttons
			.matching(NSPredicate(format: "label BEGINSWITH %@", "IMG_2259-COLLAGE.jpg"))
			.firstMatch
		XCTAssertTrue(job.waitForExistence(timeout: 30), "A pending job should be listed")
		job.tap()

		let printer = app.buttons
			.matching(NSPredicate(format: "label BEGINSWITH %@", "mfc-"))
			.firstMatch
		XCTAssertTrue(printer.waitForExistence(timeout: 30), "A printer should be listed")
		printer.tap()

		let print = app.buttons["Print"].firstMatch
		XCTAssertTrue(print.waitForExistence(timeout: 30), "Print should be offered")

		screen.capture("Print release - actions")
	}
}
