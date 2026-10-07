import XCTest

class ModuleQuickActionsTests: UITestCase {
	func testPicksAndUnpicksQuickActions() throws {
		let picker = QuickActionsScreen(app: app).navigate()
		for name in TestIdentifiers.QuickActions.defaults {
			picker.verifyPicked(name)
		}

		let ids = TestIdentifiers.QuickActions.self
		picker
			// All four slots are taken, so nothing else can be added.
			.verifyAvailable(ids.anExtra, false)
			.toggle(ids.aDefault)
			.verifyPicked(ids.aDefault, false)
			.verifyAvailable(ids.anExtra)
			.toggle(ids.anExtra)
			.verifyPicked(ids.anExtra)
			.resetToDefaults()
			.verifyPicked(ids.aDefault)
			.verifyPicked(ids.anExtra, false)
	}

	/// From a cold start, SpringBoard starts the app on the action's screen.
	/// That launch has none of the test's arguments: no --uitesting, and so
	/// live menus rather than fixtures. It asserts only which cafe is showing,
	/// which the data cannot change.
	///
	/// Only the cold start is tested. The running app takes a quick action in
	/// `windowScene(_:performActionFor:)`, which hands it to the same
	/// `openQuickAction` the cold start uses, and driving SpringBoard with the
	/// app just sent to the background costs two minutes of idle waits.
	func testQuickActionOpensItsScreenFromAColdStart() throws {
		let ids = TestIdentifiers.QuickActions.self
		HomeScreen(app: app).checkHomescreenExists()
		let springBoard = SpringBoardScreen(app: app)
		let appName = springBoard.appIconName

		app.terminate()
		springBoard
			.chooseQuickAction(ids.cageMenu, appName: appName)
			.verifyAppLaunched()
		MenusScreen(app: app).verifyShowing(ids.cageTab)
	}
}
