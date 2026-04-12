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
}
