import XCTest

class ModuleCarletonMapTests: UITestCase {
	func testIsReachableFromHomescreen() throws {
		CarletonMapScreen(app: app)
			.navigate()
			.checkSheetPresented()
	}

	/// The whole path a user takes: open the map, reach into the sheet, and
	/// come out with a building's card.
	///
	func testSelectingABuildingShowsItsCard() throws {
		CarletonMapScreen(app: app)
			.navigate()
			.checkSheetPresented()
			.expandSheet()
			.selectBuilding(named: TestIdentifiers.CarletonMap.aBuilding)
			.checkBuildingCardPresented()
	}
}
