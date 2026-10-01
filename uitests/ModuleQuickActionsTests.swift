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

	/// SpringBoard starts the app here, so this launch has none of the test's
	/// arguments: no --uitesting, and so live menus rather than fixtures. It
	/// asserts only which cafe is showing, which the data cannot change.
	func testQuickActionLaunchesToItsScreen() throws {
		HomeScreen(app: app).checkHomescreenExists()
		let appName = app.label
		app.terminate()

		SpringBoardScreen(app: app)
			.chooseQuickAction(TestIdentifiers.QuickActions.cageMenu, appName: appName)
		XCTAssertTrue(app.wait(for: .runningForeground, timeout: 30), "the app should launch")
		MenusScreen(app: app).verifyShowing(TestIdentifiers.QuickActions.cageTab)
	}
}
