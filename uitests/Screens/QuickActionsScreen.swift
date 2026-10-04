import XCTest

/// Customize → Quick Actions: the picker for the app icon's menu.
struct QuickActionsScreen: Screen {
	let app: XCUIApplication

	/// The picker itself. Home's tiles share titles with its rows and stay in
	/// the tree behind the Customize sheet, so a row is only ever queried inside
	/// this.
	private var picker: XCUIElement {
		app.element(matching: TestIdentifiers.QuickActions.screen)
	}

	private func row(_ title: String) -> XCUIElement {
		picker.buttons[title].firstMatch
	}

	/// Scroll the picker until `element` is in the tree, and fail if it never
	/// is. The form builds its rows lazily in both directions, so a row can be
	/// above the screen as easily as below it: this looks down the list first,
	/// turns back the moment a swipe shows nothing new, and stops as soon as
	/// the row appears.
	private func reveal(_ element: XCUIElement) {
		let swipes: [() -> Void] = [{ picker.swipeUp() }, { picker.swipeDown() }]
		for swipe in swipes {
			// Reading every row's label is a query per row, so skip it for a
			// row that is already in the tree.
			if element.exists {
				break
			}
			var shown = visibleRows()
			while !element.exists {
				swipe()
				let now = visibleRows()
				if now == shown { break }
				shown = now
			}
		}
		XCTAssertTrue(element.exists, "\(element) should be in the picker")
	}

	private func visibleRows() -> [String] {
		picker.buttons.allElementsBoundByIndex.map(\.label)
	}

	/// Open the picker the way a user does, from the Customize sheet.
	@discardableResult
	func navigate() -> Self {
		HomeScreen(app: app).checkHomescreenExists().openCustomize().openQuickActions()
		XCTAssertTrue(picker.waitForExistence(timeout: 10), "the quick-action picker should open")
		return self
	}

	/// Tap `title`'s row, to pick it or unpick it.
	@discardableResult
	func toggle(_ title: String) -> Self {
		let target = row(title)
		reveal(target)
		XCTAssertTrue(target.waitForHittable(timeout: 10), "\(title) should be tappable")
		target.tap()
		return self
	}

	@discardableResult
	func verifyPicked(_ title: String, _ picked: Bool = true) -> Self {
		let target = row(title)
		reveal(target)
		XCTAssertTrue(
			target.waitForSelected(picked),
			"\(title) should be \(picked ? "picked" : "unpicked")")
		return self
	}

	/// Whether `title` can be tapped: always once picked, otherwise only while
	/// a slot is free.
	@discardableResult
	func verifyAvailable(_ title: String, _ available: Bool = true) -> Self {
		let target = row(title)
		reveal(target)
		XCTAssertTrue(
			target.waitForEnabled(available),
			"\(title) should be \(available ? "available" : "unavailable")")
		return self
	}

	@discardableResult
	func resetToDefaults() -> Self {
		let reset = picker.buttons[TestIdentifiers.QuickActions.reset].firstMatch
		reveal(reset)
		XCTAssertTrue(reset.waitForHittable(timeout: 10), "Reset to Defaults should be tappable")
		reset.tap()
		return self
	}
}
