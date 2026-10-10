import XCTest

/// What one campus's screens show from its recordings, which its smoke tests
/// check. Each value comes from that campus's recording, in
/// `source/features/campus/__fixtures__/<campus id>/`, except the screen titles
/// and tiles, which the app draws itself.
struct CampusExpectations {
	let homeTitle: String
	/// A tile only this campus's Home has.
	let homeTile: String
	let hoursRoute: String
	let hoursTitle: String
	let building: String
	let mapRoute: String
	let mapPlace: String
	let contactsTitle: String
	let contact: String
	let word: String
	let transitTitle: String
	let busLine: String
	let menusRoute: String
	let cafe: String
	/// An event on the frozen date, which Day view opens on.
	let calendarEvent: String
	let newsRoute: String
	let newsTitle: String
	/// A story the campus news lists, matched within its row.
	let newsHeadline: String
	let emergencyButton: String
}

/// One campus's smoke tests: each screen opens on that campus and shows that
/// campus's recorded data. A template: each subclass names its campus, and
/// the shard planner schedules only the subclasses.
class CampusSmokeTests: UITestCaseUnbooted {
	/// The values this campus's screens show; each subclass sets its own.
	var expected: CampusExpectations { fatalError("a campus subclass sets expected") }

	/// XCTest would run the template's tests too; only its subclasses run them.
	override class var defaultTestSuite: XCTestSuite {
		self == CampusSmokeTests.self ? XCTestSuite(name: "CampusSmokeTests (template)") : super.defaultTestSuite
	}

	func opens(_ route: String, waitingFor element: XCUIElement) {
		HomeScreen(app: app).open(route: route, mountedWhen: element)
	}

	/// Some element on screen whose label holds `text`: a headline sits inside a
	/// row's label, alongside its byline.
	func shows(_ text: String) -> XCUIElement {
		app.descendants(matching: .any).matching(NSPredicate(format: "label CONTAINS %@", text)).firstMatch
	}

	/// Waits for `element`, which shows a value from this campus's recording. A
	/// recording run reads live data, where that value may have moved on or, for
	/// a calendar, not yet been moved onto the frozen day: there it skips rather
	/// than fails, so the recorder still writes, and the skip names the value to
	/// take from the new recording.
	func verifyRecorded(_ element: XCUIElement, _ value: String) throws {
		if element.waitUntilExists(timeout: 30) { return }
		if isRecordingFixtures {
			throw XCTSkip("\(value) is not in today's live data; set it from the new recording")
		}
		XCTFail("\(value) should be shown, from the recording")
	}

	func testHomeIsTheCampusOwn() throws {
		opens("/", waitingFor: app.navigationBars[expected.homeTitle])
		XCTAssertTrue(
			shows(expected.homeTile).waitUntilExists(timeout: 30),
			"Home should offer \(expected.homeTile)")
	}

	func testHoursOpensACampusBuilding() throws {
		opens(expected.hoursRoute, waitingFor: app.navigationBars[expected.hoursTitle])
		try verifyRecorded(
			app.element(matching: TestIdentifiers.Hours.rowPrefix + expected.building), expected.building)
		HoursScreen(app: app).tapRow(expected.building)
	}

	func testMapOpensASearchedBuilding() throws {
		opens(expected.mapRoute, waitingFor: app.searchFields.firstMatch)
		let map = MapScreen(app: app).focusSearch().typeIntoSearch(expected.mapPlace)
		try verifyRecorded(app.staticTexts[expected.mapPlace], expected.mapPlace)
		map.selectBuilding(named: expected.mapPlace).verifyTopCard(expected.mapPlace)
	}

	func testContactsListTheCampusOwn() throws {
		opens("/contacts", waitingFor: app.navigationBars[expected.contactsTitle])
		try verifyRecorded(app.staticTexts[expected.contact], expected.contact)
	}

	func testDictionaryListsTheCampusWords() throws {
		opens("/dictionary", waitingFor: app.navigationBars["Dictionary"])
		try verifyRecorded(app.staticTexts[expected.word], expected.word)
	}

	func testTransitListsTheCampusLines() throws {
		opens("/transit", waitingFor: app.navigationBars[expected.transitTitle])
		try verifyRecorded(app.staticTexts[expected.busLine], expected.busLine)
	}

	func testMenusShowTheFirstCafe() throws {
		opens(expected.menusRoute, waitingFor: app.tabBars.buttons[expected.cafe])
		MenusScreen(app: app).verifyFoodRowsAppear()
	}

	func testCalendarListsARecordedEvent() throws {
		opens("/calendar", waitingFor: app.navigationBars["Calendar"])
		try verifyRecorded(
			app.buttons[TestIdentifiers.Calendar.eventRowPrefix + expected.calendarEvent],
			expected.calendarEvent)
	}

	func testNewsOpensAStory() throws {
		opens(expected.newsRoute, waitingFor: app.navigationBars[expected.newsTitle])
		let story = shows(expected.newsHeadline)
		try verifyRecorded(story, expected.newsHeadline)
		story.tap()
		// A story opens on the web, in a sheet the list does not have.
		XCTAssertTrue(app.buttons["Done"].waitUntilExists(timeout: 30), "the story should open")
	}

	func testAboutNamesTheApp() throws {
		let about = AboutScreen(app: app).navigate()
		XCTAssertTrue(about.text(expected.homeTitle).waitUntilExists(timeout: 30), "About should name \(expected.homeTitle)")
	}

	func testSupportOffersTheCampusEmergencyLine() throws {
		opens("/support", waitingFor: app.navigationBars["Support"])
		XCTAssertTrue(app.buttons["Call \(expected.emergencyButton)"].waitUntilExists(timeout: 30))
	}
}

/// Tags: campus:edu.stolaf
final class StOlafSmokeTests: CampusSmokeTests {
	override class var campus: Campus? { .stolaf }

	override var expected: CampusExpectations {
		CampusExpectations(
			homeTitle: "All About Olaf",
			homeTile: "Olaf Messenger",
			hoursRoute: "/hours",
			hoursTitle: "Hours",
			building: "The Cage",
			mapRoute: "/map?campus=edu.stolaf",
			mapPlace: "Holland Hall",
			contactsTitle: "Contacts",
			contact: "PubSafe",
			word: "AAC",
			transitTitle: "Transit",
			busLine: "Express Bus",
			menusRoute: "/menus",
			cafe: "Stav Hall",
			calendarEvent: "Norwegian-American Historical Association Biennial Meeting",
			newsRoute: "/st-olaf-news",
			newsTitle: "St. Olaf News",
			newsHeadline: "A summer spent sampling careers",
			emergencyButton: "PubSafe")
	}
}

/// Tags: campus:edu.carleton
final class CarletonSmokeTests: CampusSmokeTests {
	override class var campus: Campus? { .carleton }

	override var expected: CampusExpectations {
		CampusExpectations(
			homeTitle: "CARLS",
			homeTile: "The Carletonian",
			hoursRoute: "/hours?campus=edu.carleton",
			hoursTitle: "Building Hours",
			building: "Burton",
			mapRoute: "/map?campus=edu.carleton",
			mapPlace: "Boliou Hall",
			contactsTitle: "Directory",
			contact: "Security Services",
			word: "A & I",
			transitTitle: "Transportation",
			busLine: "Carls-Go! Route 1",
			menusRoute: "/menus/burton",
			cafe: "Burton",
			calendarEvent: "Foods of Faith",
			newsRoute: "/carleton-news",
			newsTitle: "Carleton News",
			newsHeadline: "Carnegie classification for sustainability",
			emergencyButton: "Security")
	}

	func testCarletonianShowsAnIssue() throws {
		opens("/newspaper", waitingFor: app.navigationBars["The Carletonian"])
		let story = "A small adventure"
		try verifyRecorded(shows(story), story)
	}

	func testSumoListsRecordedFilms() throws {
		opens("/carleton-sumo", waitingFor: app.navigationBars["SUMO"])
		let film = "I Love Boosters"
		try verifyRecorded(shows(film), film)
	}

	func testConvoListsUpcomingAndArchived() throws {
		opens("/carleton-convos", waitingFor: app.tabBars.buttons["Archives"])
		let upcoming = "Family Weekend Convocation with Jack El-Hai"
		try verifyRecorded(shows(upcoming), upcoming)
		app.tabBars.buttons["Archives"].tap()
		let archived = "Carleton Opening Convo with Governor Tim Walz"
		try verifyRecorded(shows(archived), archived)
	}
}
