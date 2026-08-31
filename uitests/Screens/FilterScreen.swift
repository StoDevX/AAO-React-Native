import XCTest

/// The filter toolbar `@frogpond/filter` draws, and whichever presentation a
/// filter opens into -- a native pull-down menu for a short filter, a sheet of
/// rows for a long one or one carrying icons.
///
/// Four screens share this toolbar, so this screen object navigates nowhere of
/// its own: a test reaches the toolbar through the screen that shows it, then
/// drives the filters from here.
struct FilterScreen: Screen {
	let app: XCUIApplication

	/// A filter's trigger, found by its filter's key rather than its visible
	/// title. The sheet a trigger opens repeats that title in its section
	/// header, and the screen behind a presentation stays in the accessibility
	/// tree while it is up, so a title matches more than one element.
	func trigger(_ key: String) -> XCUIElement {
		app.buttons[TestIdentifiers.Filter.trigger(key)].firstMatch
	}

	/// A row in an open sheet.
	///
	/// Queried across every element type rather than as a button: a row in a
	/// selection list is plain content carrying a tag, so the list itself owns
	/// the tap and the row surfaces as a cell rather than a control.
	func option(_ title: String) -> XCUIElement {
		app.descendants(matching: .any)[TestIdentifiers.Filter.option(title)].firstMatch
	}

	/// An item in an open menu.
	///
	/// A `Toggle` inside a SwiftUI `Menu` becomes a UIKit menu action, which
	/// carries none of our identifiers -- only the label it draws. An element
	/// query cannot filter on hittability, so where the screen behind an open
	/// menu offers a button with the same label, this picks the hittable one:
	/// while a menu is up, only its own items are.
	func menuItem(_ label: String) -> XCUIElement {
		let matches = app.buttons.matching(NSPredicate(format: "label == %@", label))
		return matches.allElementsBoundByIndex.first { $0.isHittable } ?? matches.firstMatch
	}

	@discardableResult
	func tapMenuItem(_ label: String) -> Self {
		let item = menuItem(label)
		XCTAssertTrue(item.waitForExistence(timeout: 30), "the menu should offer a \(label) item")
		item.tap()
		return self
	}

	/// Close a list menu, which stays open as its options are ticked so several
	/// can be chosen in one go. Tapping outside it is the dismissal a user
	/// makes; there is no button to press.
	@discardableResult
	func dismissMenu(waitingFor label: String) -> Self {
		app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.93)).tap()
		XCTAssertTrue(
			menuItem(label).waitForNonExistence(timeout: 30),
			"the menu should be gone after tapping outside it")
		return self
	}

	@discardableResult
	func waitForTrigger(_ key: String) -> Self {
		XCTAssertTrue(
			trigger(key).waitForExistence(timeout: 30),
			"the \(key) filter should offer a trigger")
		return self
	}

	/// Tap a trigger that presents nothing -- a toggle filter, whose trigger is
	/// the control itself.
	///
	/// By coordinate, for the reason `openFilter` documents: a trigger drawing
	/// its title beside a chevron has a view for a label, and XCUITest reports
	/// such a control as not hittable though a tap at its centre works.
	@discardableResult
	func tapTrigger(_ key: String) -> Self {
		waitForTrigger(key)
		trigger(key).coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
		return self
	}

	/// Open a filter, and wait for something inside its presentation.
	///
	/// The tap goes by coordinate rather than `.tap()`: a trigger draws its
	/// title beside a chevron, so its label is a view, and XCUITest reports a
	/// view-labelled SwiftUI control as not hittable even though a tap at its
	/// centre opens it. What proves the trigger works is the `until` element
	/// appearing.
	///
	/// The tap is retried for the reason `Screen.navigateFromHome` documents:
	/// a press on a SwiftUI control can land natively before the JavaScript
	/// that answers it is wired, and nothing happens. Waiting longer does not
	/// help a tap that was never delivered.
	@discardableResult
	func openFilter(_ key: String, until element: XCUIElement) -> Self {
		waitForTrigger(key)

		for attempt in 1...3 {
			trigger(key).coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
			if element.waitForExistence(timeout: 15) {
				return self
			}
			XCTContext.runActivity(named: "Tap \(attempt) on \(key) did not open it; retrying") { _ in
			}
		}

		XCTFail("Tapping the \(key) filter never opened it")
		return self
	}

	/// Assert whether a trigger tells VoiceOver its filter is narrowing
	/// something. `isSelected` is the assertable half of the active treatment;
	/// the prominent tint it is set alongside is not visible to XCUITest.
	@discardableResult
	func verifyTrigger(_ key: String, isSelected expected: Bool) -> Self {
		waitForTrigger(key)
		XCTAssertTrue(
			trigger(key).waitForSelected(expected),
			"the \(key) trigger should\(expected ? "" : " not") report itself selected")
		return self
	}

	@discardableResult
	func tapOption(_ title: String) -> Self {
		let row = option(title)
		XCTAssertTrue(row.waitForExistence(timeout: 30), "the sheet should offer a \(title) row")
		row.tap()
		return self
	}

	/// Assert whether a sheet row draws its checkmark. The checkmark is an SF
	/// Symbol the system names "Selected", which is what puts the trait on the
	/// row it sits in.
	@discardableResult
	func verifyOption(_ title: String, isSelected expected: Bool) -> Self {
		let row = option(title)
		XCTAssertTrue(row.waitForExistence(timeout: 30), "the sheet should offer a \(title) row")
		XCTAssertTrue(
			row.waitForSelected(expected),
			"the \(title) row should\(expected ? "" : " not") be checked")
		return self
	}

	/// Swipe the sheet away.
	///
	/// The sheet's (X) commits too, so this is one of two paths a selection can
	/// take -- the gestural one, which no button drives. The drag starts just
	/// below the sheet's top edge and runs to the bottom of the screen.
	@discardableResult
	func dismissSheet(waitingFor row: String) -> Self {
		let start = app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.12))
		let end = app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.97))
		start.press(
			forDuration: 0.15, thenDragTo: end, withVelocity: .default, thenHoldForDuration: 0.1)

		XCTAssertTrue(
			option(row).waitForNonExistence(timeout: 30),
			"the sheet should be gone after a swipe down")
		return self
	}
}
