import XCTest

class ModuleCustomizeTests: UITestCase {
	/// An alternate icon can be chosen from the gallery: the plugin bundled it,
	/// and iOS accepted the switch and said so.
	func testChangesAppIconToAnAlternate() throws {
		let ids = TestIdentifiers.Customize.self
		AppIconScreen(app: app)
			.navigate()
			.restoreDefaultIcon(ids.defaultIcon)
			.select(ids.anAlternateIcon)
	}

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
}
