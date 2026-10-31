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

	/// Phone swaps Home's tiles for the hotline's keypad.
	func testChoosesPhoneLayout() throws {
		let ids = TestIdentifiers.Customize.self
		let home = HomeScreen(app: app).checkHomescreenExists().verifyTiled()
		home.openCustomize().chooseHomeLayout(ids.phoneLayout).close()
		home.verifyHotlineKeypad()
		home.openCustomize().chooseHomeLayout(ids.tiledLayout).close()
		home.verifyTiled()
	}

	/// Dialing 411 on the Phone layout calls the campus's hotline, and ending
	/// the call goes back to the keypad.
	func testDialsTheHotline() throws {
		let home = HomeScreen(app: app).checkHomescreenExists()
		home.openCustomize().chooseHomeLayout(TestIdentifiers.Customize.phoneLayout).close()
		home.verifyHotlineKeypad()
			.dialHotline("411", reaching: "Wiki Monkeys Hotline")
			.endHotlineCall()
	}
}
