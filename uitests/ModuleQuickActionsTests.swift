import XCTest

class ModuleQuickActionsTests: UITestCase {
	func testPicksAndUnpicksQuickActions() throws {
		let picker = QuickActionsScreen(app: app).navigate()
		for name in TestIdentifiers.QuickActions.defaults {
			picker.verifyPicked(name)
		}

		picker
			.capture("Quick actions with the defaults picked")
			// All four slots are taken, so nothing else can be added.
			.verifyAvailable("Calendar", false)
			.toggle("Transit")
			.verifyPicked("Transit", false)
			.verifyAvailable("Calendar")
			.toggle("Calendar")
			.verifyPicked("Calendar")
			.resetToDefaults()
			.verifyPicked("Transit")
			.verifyPicked("Calendar", false)
	}

	/// A link that pushes a screen over the map must not leave the map's sheet
	/// floating over that screen, and the sheet must come back with the map.
	///
	/// Then, from a cold start, SpringBoard starts the app on the action's
	/// screen. That launch has none of the test's arguments: no --uitesting, and
	/// so live menus rather than fixtures. It asserts only which cafe is
	/// showing, which the data cannot change.
	func testQuickActionOpensItsScreenWarmAndCold() throws {
		let map = MapScreen(app: app).navigate().checkSheetPresented()
		let appName = app.label

		SpringBoardScreen(app: app)
			.chooseQuickAction(TestIdentifiers.QuickActions.cageMenu, appName: appName)
		MenusScreen(app: app).verifyShowing(TestIdentifiers.QuickActions.cageTab)
		map.verifySheetDismissed()

		MenusScreen(app: app).goBack()
		map.checkSheetPresented()

		app.terminate()
		SpringBoardScreen(app: app)
			.chooseQuickAction(TestIdentifiers.QuickActions.cageMenu, appName: appName)
		XCTAssertTrue(app.wait(for: .runningForeground, timeout: 30), "the app should launch")
		MenusScreen(app: app).verifyShowing(TestIdentifiers.QuickActions.cageTab)
	}
}
