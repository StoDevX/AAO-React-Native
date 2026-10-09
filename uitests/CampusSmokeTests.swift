import XCTest

/// What one campus's screens show from its recordings, which its smoke tests
/// check. Each value comes from that campus's
/// recording, in `source/features/campus/__fixtures__/<domain>/`.
struct CampusExpectations {
	let homeTitle: String
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

	private func opens(_ route: String, waitingFor element: XCUIElement) {
		HomeScreen(app: app).open(route: route, mountedWhen: element)
	}

	func testHomeIsTheCampusOwn() throws {
		opens("/", waitingFor: app.navigationBars[expected.homeTitle])
	}

	func testHoursListsTheCampusBuildings() throws {
		opens(expected.hoursRoute, waitingFor: app.navigationBars[expected.hoursTitle])
		HoursScreen(app: app).verifyRowShown(expected.building)
	}

	func testMapFindsACampusBuilding() throws {
		opens(expected.mapRoute, waitingFor: app.searchFields.firstMatch)
		let field = app.searchFields.firstMatch
		field.tap()
		field.typeText(expected.mapPlace)
		XCTAssertTrue(
			app.staticTexts[expected.mapPlace].waitUntilExists(timeout: 30),
			"\(expected.mapPlace) should be found on the map")
	}

	func testContactsListTheCampusOwn() throws {
		opens("/contacts", waitingFor: app.navigationBars[expected.contactsTitle])
		XCTAssertTrue(
			app.staticTexts[expected.contact].waitUntilExists(timeout: 30),
			"\(expected.contact) should be listed")
	}

	func testDictionaryListsTheCampusWords() throws {
		opens("/dictionary", waitingFor: app.navigationBars["Dictionary"])
		XCTAssertTrue(
			app.staticTexts[expected.word].waitUntilExists(timeout: 30),
			"\(expected.word) should be listed")
	}

	func testTransitListsTheCampusLines() throws {
		opens("/transit", waitingFor: app.navigationBars[expected.transitTitle])
		XCTAssertTrue(
			app.staticTexts[expected.busLine].waitUntilExists(timeout: 30),
			"\(expected.busLine) should be listed")
	}

	func testMenusShowTheFirstCafe() throws {
		opens(expected.menusRoute, waitingFor: app.tabBars.buttons[expected.cafe])
		MenusScreen(app: app).verifyFoodRowsAppear()
	}

	func testCalendarListsARecordedEvent() throws {
		opens("/calendar", waitingFor: app.navigationBars["Calendar"])
		let calendar = CalendarScreen(app: app)
		if isRecordingFixtures {
			// A live calendar may hold nothing yet on the frozen day: the recorder
			// moves its events there after the run, so only the fetch is needed now.
			XCTAssertTrue(calendar.waitUntilDayLoads(), "the calendar should finish loading")
			throw XCTSkip("the recorder shifts the calendars onto the frozen day after the run")
		}
		calendar.verifyRowPresent(expected.calendarEvent)
	}

	func testSupportOffersTheCampusEmergencyLine() throws {
		opens("/support", waitingFor: app.navigationBars["Support"])
		XCTAssertTrue(app.buttons["Call \(expected.emergencyButton)"].waitUntilExists(timeout: 30))
	}
}

/// Tags: campus:stolaf.edu
final class StOlafSmokeTests: CampusSmokeTests {
	override class var campus: Campus? { .stolaf }

	override var expected: CampusExpectations {
		CampusExpectations(
			homeTitle: "All About Olaf",
			hoursRoute: "/hours",
			hoursTitle: TestIdentifiers.Hours.title,
			building: "The Cage",
			mapRoute: "/map?campus=stolaf",
			mapPlace: "Holland Hall",
			contactsTitle: "Contacts",
			contact: "PubSafe",
			word: "AAC",
			transitTitle: "Transit",
			busLine: "Express Bus",
			menusRoute: "/menus",
			cafe: "Stav Hall",
			calendarEvent: "St. Olaf Vaccine Clinic",
			emergencyButton: "PubSafe")
	}
}

/// Tags: campus:carleton.edu
final class CarletonSmokeTests: CampusSmokeTests {
	override class var campus: Campus? { .carleton }

	override var expected: CampusExpectations {
		CampusExpectations(
			homeTitle: "CARLS",
			hoursRoute: "/hours?campus=carleton",
			hoursTitle: TestIdentifiers.Hours.carletonTitle,
			building: "Burton",
			mapRoute: "/map?campus=carleton",
			mapPlace: "Boliou Hall",
			contactsTitle: "Important Contacts",
			contact: "Security Services",
			word: "A & I",
			transitTitle: "Transportation",
			busLine: "Carls-Go! Route 1",
			menusRoute: "/menus/burton",
			cafe: "Burton",
			calendarEvent: "First-Gen Friday",
			emergencyButton: "Security")
	}

	/// Some element on screen whose label holds `text`: a headline sits inside a
	/// row's label, alongside its byline.
	private func shows(_ text: String) -> XCUIElement {
		app.descendants(matching: .any).matching(NSPredicate(format: "label CONTAINS %@", text)).firstMatch
	}

	func testCarletonianShowsAnIssue() throws {
		HomeScreen(app: app).open(route: "/carletonian", mountedWhen: app.navigationBars["The Carletonian"])
		let story = "A small adventure"
		XCTAssertTrue(shows(story).waitUntilExists(timeout: 30), "\(story) should be on the front page")
	}

	func testCarletonNewsOpensAStory() throws {
		HomeScreen(app: app).open(route: "/carleton-news", mountedWhen: app.navigationBars["Carleton News"])
		let story = shows("Carnegie classification for sustainability")
		XCTAssertTrue(story.waitUntilExists(timeout: 30), "a recorded story should be listed")
		story.tap()
		XCTAssertTrue(app.navigationBars.buttons.firstMatch.waitUntilExists(timeout: 30))
	}

	func testSumoListsRecordedFilms() throws {
		HomeScreen(app: app).open(route: "/carleton-sumo", mountedWhen: app.navigationBars["SUMO"])
		let film = "I Love Boosters"
		XCTAssertTrue(shows(film).waitUntilExists(timeout: 30), "\(film) should be listed")
	}

	func testConvoListsUpcomingAndArchived() throws {
		HomeScreen(app: app).open(route: "/carleton-convos", mountedWhen: app.tabBars.buttons["Archives"])
		let upcoming = "Family Weekend Convocation with Jack El-Hai"
		XCTAssertTrue(shows(upcoming).waitUntilExists(timeout: 30), "\(upcoming) should be upcoming")
		app.tabBars.buttons["Archives"].tap()
		let archived = "Carleton Opening Convo with Governor Tim Walz"
		XCTAssertTrue(shows(archived).waitUntilExists(timeout: 30), "\(archived) should be archived")
	}
}
