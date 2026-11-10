import XCTest

/// One app's App Store screenshots, taken from its campus's recordings on the
/// frozen day. Not tests of the app: `mise run screenshots` runs them on a
/// 6.3-inch simulator with its status bar set, and collects what they attach.
/// The shard planner skips this folder, so they never run on CI.
///
/// A template, as `CampusSmokeTests` is: each subclass names its campus and
/// the app that ships it. The numbers order the screenshots on the store page.
class StoreScreenshotTests: UITestCaseUnbooted {
	/// The app these screenshots are for, as `APP_VARIANT` names it: the folder they land in.
	var variant: String { fatalError("an app's subclass sets variant") }
	/// The values this campus's screens show.
	var expected: CampusExpectations { fatalError("an app's subclass sets expected") }
	/// The campus's radio station: its tab in the player, and its name as the Play button says it.
	var station: (tab: String, name: String) { fatalError("an app's subclass sets station") }

	/// XCTest would run the template's tests too; only its subclasses run them.
	override class var defaultTestSuite: XCTestSuite {
		self == StoreScreenshotTests.self ? XCTestSuite(name: "StoreScreenshotTests (template)") : super.defaultTestSuite
	}

	override func setUpWithError() throws {
		try super.setUpWithError()
		// Both campuses keep Central time, and the app prints hours in the
		// device's zone, which a simulator takes from its Mac.
		app.launchEnvironment["TZ"] = "America/Chicago"
	}

	/// Attaches the whole screen, status bar and all, under the name
	/// `scripts/store-screenshots-run.mjs` files it by.
	func shoot(_ name: String) {
		// A pause, not a wait: a picture still fading in is on screen as far as
		// any query can tell.
		Thread.sleep(forTimeInterval: 2)
		let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
		attachment.name = "store \(variant) \(name)"
		attachment.lifetime = .keepAlways
		add(attachment)
	}

	/// Fails unless `element`, which shows a value from the recording, is up.
	func requires(_ element: XCUIElement, _ value: String) {
		XCTAssertTrue(element.waitUntilExists(timeout: 30), "\(value) should be shown, from the recording")
	}

	func testHome() throws {
		opens("/", waitingFor: app.navigationBars[expected.homeTitle])
		requires(shows(expected.homeTile), expected.homeTile)
		shoot("01-home")
	}

	func testMenus() throws {
		// A phone's café tabs are a tab bar; an iPad's are a row of buttons above the menu.
		opens(expected.menusRoute, waitingFor: app.buttons[expected.cafe].firstMatch)
		MenusScreen(app: app).verifyFoodRowsAppear()
		shoot("02-menus")
	}

	func testHours() throws {
		opens(expected.hoursRoute, waitingFor: app.navigationBars[expected.hoursTitle])
		HoursScreen(app: app).tapRow(expected.building)
		shoot("03-hours")
	}

	func testNewspaper() throws {
		MessFrontPage(app: app).navigate().verifyNewestIssueShown()
		shoot("04-newspaper")
	}

	/// The radio as its sheet opens on the campus's station, before anything plays.
	func testRadio() throws {
		opens("/", waitingFor: app.navigationBars[expected.homeTitle])
		// The player offers every campus's stations, and a fresh install's sheet opens on KSTO.
		StreamingMediaScreen(app: app)
			.openSheetFromBar(expecting: "Play KSTO 93.1 FM")
			.press(station.tab, expecting: "Play \(station.name)")
		shoot("05-radio")
		// The sheet asks for the station's schedule, which no campus has
		// recorded: this screenshot is of the player alone. Any other
		// unanswered request still fails the test.
		MissingFixtures.forgive(keysContaining: "-schedule")
	}

	func testTransit() throws {
		opens("/transit", waitingFor: app.navigationBars[expected.transitTitle])
		requires(app.staticTexts[expected.busLine], expected.busLine)
		shoot("06-transit")
	}

	func testMap() throws {
		opens(expected.mapRoute, waitingFor: app.searchFields.firstMatch)
		MapScreen(app: app)
			.focusSearchForTyping()
			.typeIntoSearch(expected.mapPlace)
			.selectBuilding(named: expected.mapPlace)
			.verifyTopCard(expected.mapPlace)
		shoot("07-map")
	}

	func testCalendar() throws {
		opens("/calendar", waitingFor: app.navigationBars["Calendar"])
		requires(
			app.buttons[TestIdentifiers.Calendar.eventRowPrefix + expected.calendarEvent],
			expected.calendarEvent)
		shoot("08-calendar")
	}
}

/// All About Olaf's, with the Olaf Messenger as its paper.
///
/// Tags: campus:edu.stolaf
final class StOlafStoreScreenshots: StoreScreenshotTests {
	override class var campus: Campus? { .stolaf }
	override var variant: String { "aao" }
	override var expected: CampusExpectations { .stolaf }
	override var station: (tab: String, name: String) { ("KSTO", "KSTO 93.1 FM") }
}

/// CARLS's, with the Carletonian as its paper.
///
/// Tags: campus:edu.carleton
final class CarletonStoreScreenshots: StoreScreenshotTests {
	override class var campus: Campus? { .carleton }
	override var variant: String { "carls" }
	override var expected: CampusExpectations { .carleton }
	override var station: (tab: String, name: String) { ("KRLX", "88.1 KRLX-FM") }
}
