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
		CalendarScreen(app: app).verifyRowPresent(expected.calendarEvent)
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
			calendarEvent: "Orientation for new students",
			emergencyButton: "PubSafe")
	}
}
