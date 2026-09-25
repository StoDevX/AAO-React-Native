import XCTest

class ModuleNewsTests: UITestCase {
	func testOlafMessengerIsReachableFromHomescreen() throws {
		NewsScreen(app: app, tile: TestIdentifiers.Buttons.olafMessenger, title: "The Olaf Messenger")
			.navigate()
			.verifyTitle()
			.verifyNewsRowsAppear()
	}

	func testStOlafNewsIsReachableFromHomescreen() throws {
		NewsScreen(app: app, tile: TestIdentifiers.Buttons.stOlafNews, title: "St. Olaf News")
			.navigate()
			.verifyTitle()
			.verifyNewsRowsAppear()
	}
}
