import XCTest

extension XCUIApplication {
	/// Find an element by its accessibility identifier regardless of element type.
	/// React Native testID maps to accessibilityIdentifier, but the XCUITest
	/// element type varies depending on the component (button, other, cell, etc.).
	func element(matching identifier: String) -> XCUIElement {
		descendants(matching: .any)[identifier].firstMatch
	}
}
