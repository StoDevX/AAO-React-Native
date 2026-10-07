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
		// swiping mid-slide carries straight past the icon. The first page gets
		// longer, since the Home Screen is still sliding in from the app: two
		// seconds there swiped past the icon and on into the App Library.
		let icon = springboard.icons[appName].firstMatch
		var pages = 0
		while !waitForOnScreen(icon, timeout: pages == 0 ? 10 : 4) && pages < 3 {
			springboard.swipeLeft()
			pages += 1
		}
		XCTAssertTrue(icon.isHittable, "\(appName)'s icon should be on the Home Screen")

		icon.press(forDuration: 1.0)

		// With the app just sent to the background, SpringBoard does not go
		// idle, so the press and the tap each sit through XCUITest's full
		// quiescence timeout, about a minute apiece. From a cold start, with
		// the app not running, the same two take seconds.
		let item = springboard.buttons[action]
		XCTAssertTrue(item.waitUntilExists(timeout: 5), "\(action) should be in the icon's menu")
		item.tap()
		return self
	}

	/// Wait for `icon` to be hittable and wholly on screen. An icon on the
	/// next Home Screen page reads as hittable from just past the screen's
	/// edge, so a press there finds nothing to press.
	private func waitForOnScreen(_ icon: XCUIElement, timeout: TimeInterval) -> Bool {
		let screen = springboard.frame
		return waitUntil("Waiting \(timeout)s for \(icon) to be on screen", timeout: timeout) {
			icon.exists && icon.isHittable && screen.contains(icon.frame)
		}
	}
}
