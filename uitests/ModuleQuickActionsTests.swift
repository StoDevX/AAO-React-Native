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
}
