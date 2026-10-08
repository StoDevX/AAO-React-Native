import XCTest

/// `isStoprintMocked` follows `isUITesting`, so a UI-test launch is served from
/// `__mocks__` rather than PaperCut. That is what lets these tests reach a job
/// list at all, and it is also why the signed-out notice is unreachable here:
/// the mocked launch never asks for an account. That branch is covered by
/// `printJobsGate` in source/features/stoprint/__tests__/print-jobs-gate.test.ts,
/// which can state the mocked and unmocked cases alike.
/// Routes: /print-jobs
class ModuleStoPrintTests: UITestCaseUnbooted {

	/// A job already sent opens the release screen directly. A Pending Release
	/// job's row instead pushes the printer list, and a printer chosen there
	/// opens the release screen with Print offered.
	func testAPendingJobReleasesThroughThePrinterList() throws {
		let ids = TestIdentifiers.StoPrint.self
		StoPrintScreen(app: app)
			.navigate()
			.verifyJobsListed()
			.openJob(ids.aSentJob, until: ids.jobInfo)
			.goBack()
			.openJob(ids.aPendingJob, until: ids.printerPrefix)
			.choosePrinter()
	}
}
