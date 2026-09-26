import XCTest

/// The Olaf Messenger's filter: the "News filter" menu in the bottom toolbar,
/// which offers every story, a whole section, or one of a section's columns.
///
/// A section with columns is a submenu, and its columns only enter the
/// hierarchy once it has been opened. Each choice is a `Toggle` inside a SwiftUI
/// `Menu`, which reaches XCUITest as a button carrying only the label it draws.
struct MessFilter: Screen {
	let app: XCUIApplication

	/// Narrow the list to one column of a section, then close the menu.
	@discardableResult
	func choose(column: String, in section: String) -> Self {
		open()
		tapItem(section)
		tapItem(column)
		// The toggle's selection is the far end of a round trip through
		// JavaScript. The list re-renders in that same pass, so once the column
		// reads as chosen the rows below are already the column's, or loading.
		XCTAssertTrue(
			item(column).waitForSelected(true),
			"\(column) should be chosen in the filter after tapping it")
		dismiss(waitingFor: column)
		return self
	}

	/// Open the menu with one tap, once the list's rows are showing. A row on
	/// screen means the push onto this screen has finished; a tap sent while
	/// it is still running goes nowhere. The button's own `isHittable` is no
	/// use as the signal: XCUITest reports a control drawn in a SwiftUI host as
	/// not hittable, though a tap at its centre works.
	private func open() {
		let row = app.descendants(matching: .any)
			.matching(NSPredicate(format: "identifier BEGINSWITH %@", TestIdentifiers.News.rowPrefix))
			.firstMatch
		XCTAssertTrue(row.waitForExistence(timeout: 30), "the list should show its rows before the filter is opened")
		let picker = app.buttons[TestIdentifiers.News.picker]
		XCTAssertTrue(picker.waitForExistence(timeout: 30), "the filter should be in the toolbar")
		picker.tap()
	}

	/// An item in the open menu. Where the screen behind it offers a button with
	/// the same label, this picks the hittable one: while a menu is up, only its
	/// own items are.
	private func item(_ label: String) -> XCUIElement {
		let matches = app.buttons.matching(NSPredicate(format: "label == %@", label))
		return matches.allElementsBoundByIndex.first { $0.isHittable } ?? matches.firstMatch
	}

	private func tapItem(_ label: String) {
		let element = item(label)
		XCTAssertTrue(element.waitForExistence(timeout: 30), "the filter should offer \(label)")
		element.tap()
	}

	/// The menu stays open as a choice is ticked, so it is closed the way a
	/// reader closes it: by tapping outside it. A pull-down menu offers no
	/// element to dismiss it by -- neither XCUITest nor the accessibility tree
	/// shows one while it is open -- so the tap goes to a point on the screen.
	/// A fifth of the way down is above the menu, which opens upward from the
	/// bottom toolbar, and below the navigation bar, whose Back button would
	/// take the tap as its own.
	private func dismiss(waitingFor label: String) {
		app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.2)).tap()
		XCTAssertTrue(
			item(label).waitForNonExistence(timeout: 30),
			"the filter menu should close after tapping outside it")
	}
}
