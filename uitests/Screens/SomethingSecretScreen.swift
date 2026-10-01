import XCTest

/// The slab below the home screen's notice.
struct SomethingSecretScreen: Screen {
	let app: XCUIApplication

	/// Launches the app with the slab already at `progress` taps.
	@discardableResult
	func launch(at progress: Int) -> Self {
		app.terminate()
		app.launchArguments.removeAll { $0.hasPrefix("--secret-progress=") }
		app.launchArguments.append(TestIdentifiers.SomethingSecret.launchArgument(progress: progress))
		app.launch()
		HomeScreen(app: app).checkHomescreenExists()
		return self
	}

	@discardableResult
	func scrollToSlab() -> Self {
		let slab = app.element(matching: TestIdentifiers.SomethingSecret.slab)
		scrollUntilExists(slab)
		// The slab sits at the very bottom; one more swipe brings all 180 points into view.
		app.swipeUp()
		XCTAssertTrue(slab.waitForExistence(timeout: 10), "The secret slab should be below the notice")
		return self
	}

	/// Scrolls to the red button an open slab shows. The slab itself leaves the accessibility tree
	/// once open, so the button is the only thing there to find.
	@discardableResult
	func scrollToButton() -> Self {
		let button = app.buttons[TestIdentifiers.SomethingSecret.button]
		scrollUntilExists(button)
		app.swipeUp()
		XCTAssertTrue(button.waitForExistence(timeout: 10), "The open slab should show the red button")
		return self
	}

	@discardableResult
	func pushTheButton() -> Self {
		app.buttons[TestIdentifiers.SomethingSecret.button].tap()
		return self
	}

	@discardableResult
	func checkAppIsResting() -> Self {
		let resting = app.staticTexts[TestIdentifiers.SomethingSecret.resting]
		// The melt runs 3.3 seconds before the dead screen shows through.
		XCTAssertTrue(resting.waitForExistence(timeout: 15), "Pushing the button should lock the app")
		return self
	}

	/// Launches the app with a red-button lockout that has already run out, so it ends at once.
	@discardableResult
	func launchWithLockoutEnded() -> Self {
		app.terminate()
		app.launchArguments.append(TestIdentifiers.SomethingSecret.lockoutEnded)
		app.launch()
		HomeScreen(app: app).checkHomescreenExists()
		return self
	}

	/// Scrolls to the bottom of the home screen and checks the slab's space is gone.
	@discardableResult
	func checkSlabIsBuried() -> Self {
		let notice = app.element(matching: TestIdentifiers.Home.notice)
		scrollUntilExists(notice)
		app.swipeUp()
		XCTAssertTrue(notice.waitForExistence(timeout: 10), "The notice should end the home screen")
		let slab = app.element(matching: TestIdentifiers.SomethingSecret.slab)
		XCTAssertFalse(slab.exists, "The slab should be buried after a lockout ends")
		return self
	}
}
