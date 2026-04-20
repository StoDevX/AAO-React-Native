import XCTest

struct BuildingHoursScreen: Screen {
	let app: XCUIApplication

	@discardableResult
	func navigate() -> Self {
		navigateFromHome(to: TestIdentifiers.Buttons.buildingHours)
	}

	@discardableResult
	func verifyBuildingHoursTitle() -> Self {
		verifyTitle(TestIdentifiers.Buttons.buildingHours)
	}
}
