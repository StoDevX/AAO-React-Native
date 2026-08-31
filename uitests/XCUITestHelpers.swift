import XCTest

extension XCUIApplication {
	/// Find an element by its accessibility identifier regardless of element type.
	/// React Native testID maps to accessibilityIdentifier, but the XCUITest
	/// element type varies depending on the component (button, other, cell, etc.).
	func element(matching identifier: String) -> XCUIElement {
		descendants(matching: .any)[identifier].firstMatch
	}

	/// Find a React Navigation bottom tab bar button by its visible label.
	/// On iOS, tab labels include a suffix like ", tab, 1 of 3" in their
	/// accessibility label, so an exact match on just the name won't work.
	func tabButton(_ label: String) -> XCUIElement {
		buttons.matching(NSPredicate(format: "label BEGINSWITH %@", label)).firstMatch
	}

	/// Find every food row currently in the tree whose label does not mention
	/// the given cor-icon. `foodRowLabel` appends each of an item's cor-icon
	/// names to its label, so this is how a test asks whether a dietary filter
	/// actually narrowed the list.
	func foodRows(withoutDietaryLabel label: String) -> XCUIElementQuery {
		buttons.matching(
			NSPredicate(
				format: "identifier BEGINSWITH %@ AND NOT (label CONTAINS %@)",
				TestIdentifiers.Menus.foodRowPrefix, label))
	}

	/// Find any accessible element whose label starts with the given text.
	/// Useful for React Native Pressable-wrapped elements whose accessibility
	/// label is the concatenation of child text content (which may include
	/// trailing icon glyphs from react-native-vector-icons).
	func elementWithLabel(startingWith label: String) -> XCUIElement {
		descendants(matching: .any)
			.matching(NSPredicate(format: "label BEGINSWITH %@", label))
			.firstMatch
	}
}

extension XCUIElement {
	/// Wait for this element to report the given selection state.
	///
	/// A selection is the far end of a round trip -- a tap reaches JavaScript,
	/// the filter state changes, and the control re-renders -- so it is never
	/// already settled when `tap()` returns. Polling a predicate rather than
	/// reading `isSelected` once is what separates "not yet" from "never".
	func waitForSelected(_ expected: Bool, timeout: TimeInterval = 30) -> Bool {
		let predicate = NSPredicate(format: expected ? "isSelected == true" : "isSelected == false")
		let expectation = XCTNSPredicateExpectation(predicate: predicate, object: self)
		return XCTWaiter().wait(for: [expectation], timeout: timeout) == .completed
	}
}
