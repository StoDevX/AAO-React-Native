import XCTest

/// The Home Screen, where the app's icon and its quick actions live.
struct SpringBoardScreen: Screen {
	let app: XCUIApplication

	private let springboard = XCUIApplication(bundleIdentifier: TestIdentifiers.SpringBoard.bundleIdentifier)

	/// The app icon's label, which `chooseQuickAction` finds the icon by. Read
	/// while the app runs.
	var appIconName: String { app.label }

	/// The app has come to the foreground, as a quick action from a cold start
	/// should bring it.
	@discardableResult
	func verifyAppLaunched() -> Self {
		XCTAssertTrue(app.wait(for: .runningForeground, timeout: 30), "the app should launch")
		return self
	}

	/// Go to the Home Screen, long-press the app's icon, and choose `action`
	/// from its menu. `appName` is the icon's label, read from `app.label`
	/// while the app runs.
	@discardableResult
	func chooseQuickAction(_ action: String, appName: String) -> Self {
		XCUIDevice.shared.press(.home)

		// A freshly installed app lands past the first page, so page through
		// until its icon is on screen. Each page is given a moment to settle:
		// mid-slide the icon is not yet hittable, and swiping again then
		// carries straight past it. The first page gets longer, since the Home
		// Screen is still sliding in from the app: two seconds there swiped
		// past the icon and on into the App Library.
		let icon = springboard.icons[appName].firstMatch
		var pages = 0
		while !icon.waitForHittable(timeout: pages == 0 ? 10 : 4) && pages < 3 {
			springboard.swipeLeft()
			pages += 1
		}
		XCTAssertTrue(icon.isHittable, "\(appName)'s icon should be on the Home Screen")

		icon.press(forDuration: 1.0)

		// With the app just sent to the background, SpringBoard does not go
		// idle, so the press and the tap each sit through XCUITest's full
		// quiescence timeout, about a minute apiece. From a cold start the same
		// two took two seconds and one. Sending them through `app` instead
		// never reaches SpringBoard.
		let item = springboard.buttons[action]
		XCTAssertTrue(item.waitForExistence(timeout: 5), "\(action) should be in the icon's menu")
		item.tap()
		return self
	}
}
