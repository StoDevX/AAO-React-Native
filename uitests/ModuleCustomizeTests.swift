import XCTest

/// Tags: campus:example.college
class ModuleCustomizeTests: UITestCase {
	/// Home's layout is chosen in Customize: List swaps the tile grid for a
	/// list, and Tiled brings the grid back.
	func testChoosesHomeLayout() throws {
		let ids = TestIdentifiers.Customize.self
		let home = HomeScreen(app: app).checkHomescreenExists().verifyTiled()
		home.openCustomize().chooseHomeLayout(ids.listLayout).close()
		home.verifyListed()
		home.openCustomize().chooseHomeLayout(ids.tiledLayout).close()
		home.verifyTiled()
	}

	/// Phone, which dev mode offers, swaps Home's tiles for the hotline's keypad.
	func testChoosesPhoneLayout() throws {
		let ids = TestIdentifiers.Customize.self
		let home = HomeScreen(app: app).checkHomescreenExists().enableDevMode().verifyTiled()
		home.openCustomize().chooseHomeLayout(ids.phoneLayout).close()
		home.verifyHotlineKeypad()
		home.openCustomize().chooseHomeLayout(ids.tiledLayout).close()
		home.verifyTiled()
	}

	/// The Phone layout waits with 411 dialed; calling it reaches the campus's
	/// hotline, and ending the call leaves 411 ready to call again.
	func testDialsTheHotline() throws {
		let home = HomeScreen(app: app).checkHomescreenExists().enableDevMode()
		home.openCustomize().chooseHomeLayout(TestIdentifiers.Customize.phoneLayout).close()
		home.verifyHotlineKeypad()
			.verifyDialed("411")
			.callHotline(reaching: "411")
			.endHotlineCall()
			.verifyDialed("411")
	}
}
