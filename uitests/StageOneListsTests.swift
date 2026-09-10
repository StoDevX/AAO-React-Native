import XCTest

/// Screenshots the lists moved from `SectionList` to `@expo/ui` in stage one,
/// so the grouping, spacing and row layout can be looked at rather than
/// inferred. Each test captures before it asserts: `continueAfterFailure` is
/// false, so a capture placed after a failed assertion never runs.
///
/// Print Jobs reaches its list because `isStoprintMocked` follows
/// `isUITesting`, so the job screens are served from `__mocks__` rather than
/// PaperCut.
class StageOneListsTests: UITestCase {
	/// A control, not a stage-one screen: Menus was already an `@expo/ui`
	/// `insetGrouped` list on master and sits under the same native tab bar, so
	/// its bottom row settles whether content scrolling under that bar is
	/// something stage one introduced or something the house pattern already
	/// did.
	func testMenusListForComparison() throws {
		MenusScreen(app: app)
			.navigate()
			.verifyFoodRowsAppear()
			.capture("Menus - control")
	}

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

	func testStudentOrgsList() throws {
		StudentOrgsScreen(app: app)
			.navigate()
			.capture("Student Orgs")
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

	/// The first screen to draw a thumbnail through the shared row, so this is
	/// where a remote image hosted inside a SwiftUI list gets looked at.
	func testStreamingMediaList() throws {
		StreamingMediaScreen(app: app)
			.navigate()
			.checkStreamListExists()
			.capture("Streaming Media")
	}

	/// The four detail screens, each of which is mostly label-beside-value rows.
	func testSISBalances() throws {
		SISScreen(app: app)
			.navigate()
			.acceptAcknowledgement()
			.checkBalancesVisible()
			.capture("SIS - Balances")
	}

	func testStudentOrgDetail() throws {
		let screen = StudentOrgsScreen(app: app).navigate()

		// The first org alphabetically, whatever the college is listing today.
		let firstOrg = app.buttons
			.matching(NSPredicate(format: "label BEGINSWITH %@", "Academic"))
			.firstMatch
		XCTAssertTrue(firstOrg.waitForExistence(timeout: 30), "An org should be listed")
		firstOrg.tap()

		screen.capture("Student Orgs - detail")
	}

	func testDirectoryContactDetail() throws {
		let screen = DirectoryScreen(app: app).navigate()

		let contact = app.buttonLabelled(TestIdentifiers.Directory.aContact)
		XCTAssertTrue(contact.waitForExistence(timeout: 30), "A contact tile should be shown")
		contact.tap()

		screen.capture("Directory - contact detail")
	}

	/// Searches the catalogue, which under UI testing holds one course, and
	/// opens it. That course carries something for every section the detail
	/// screen draws.
	func testCourseDetail() throws {
		let screen = CourseCatalogScreen(app: app).navigate()

		let field = app.searchFields.firstMatch
		XCTAssertTrue(field.waitForExistence(timeout: 30), "Course search should offer a field")
		field.tap()
		field.typeText(TestIdentifiers.CourseCatalog.aCourse)

		let result = app.buttons
			.matching(NSPredicate(format: "label CONTAINS %@", TestIdentifiers.CourseCatalog.aCourse))
			.firstMatch
		XCTAssertTrue(result.waitForExistence(timeout: 30), "The fixture course should be found")
		result.tap()

		let prerequisites = app.staticTexts["Prerequisites"].firstMatch
		XCTAssertTrue(
			prerequisites.waitForExistence(timeout: 30),
			"The course detail screen should be shown")

		screen.capture("Course detail")
	}

	func testMoreList() throws {
		MoreScreen(app: app)
			.navigate()
			.verifyMoreTitle()
			.capture("More")
	}

	func testTransportationOtherModesList() throws {
		let screen = TransportationScreen(app: app).navigate()

		let otherTab = app.tabButton("Other")
		XCTAssertTrue(
			otherTab.waitForExistence(timeout: 30),
			"Other tab should be visible on Transportation")
		otherTab.tap()

		screen.capture("Transportation - Other Modes")
	}

	func testStudentWorkList() throws {
		SISScreen(app: app)
			.navigate()
			.openJobsTab()
			.capture("SIS - Open Jobs")
	}

	func testAthleticsFilterList() throws {
		let screen = AthleticsScreen(app: app).navigate()

		// The tab bar is a TouchableOpacity carrying accessibilityRole="tab",
		// which does not surface as a button -- so this asks for any descendant
		// with the label rather than a button with it.
		let filterTab = app.descendants(matching: .any)
			.matching(NSPredicate(format: "label == %@", "Filter"))
			.firstMatch
		let found = filterTab.waitForExistence(timeout: 30)

		// Captured before the assertion: Athletics draws no tab bar at all when
		// the feed has no scores, and the screenshot is what tells the two
		// apart.
		screen.capture("Athletics - after navigate")
		XCTAssertTrue(found, "Filter tab should be visible on Athletics")

		filterTab.tap()
		screen.capture("Athletics - Filter")
	}

	/// The scores tab, which draws two remote crests per row through
	/// `RNHostView`. Athletics opens on Today, which may legitimately have no
	/// games -- the capture is taken either way, since an empty state is worth
	/// seeing too.
	func testAthleticsScoresList() throws {
		AthleticsScreen(app: app)
			.navigate()
			.capture("Athletics - Scores")
	}
}
