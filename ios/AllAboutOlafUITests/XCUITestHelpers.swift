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

	/// Find any accessible element whose label starts with the given text.
	/// Useful for React Native Pressable-wrapped elements whose accessibility
	/// label is the concatenation of child text content (which may include
	/// trailing icon glyphs from react-native-vector-icons).
	func elementWithLabel(startingWith label: String) -> XCUIElement {
		descendants(matching: .any)
			.matching(NSPredicate(format: "label BEGINSWITH %@", label))
			.firstMatch
	}

	/// Experimental helper for dismissing a SFSafariViewController. TBD which of these is correct.
	func dismissSafariViewController(timeout: TimeInterval = 5) {
		XCTContext.runActivity(named: "Dismiss SFSafariViewCOntroller") { activity in
			let buttonLabels = ["Done", "Close"]
			let apps = [
				XCUIApplication(),
				XCUIApplication(bundleIdentifier: "com.apple.SafariViewService"),
				XCUIApplication(bundleIdentifier: "com.apple.mobilesafari"),
			]
			
			for app in apps {
				for label in buttonLabels {
					let button = app.buttons[label]
					if button.waitForExistence(timeout: 1) {
						button.tap()
						return
					}
				}
			}
			
			XCTFail("Could not find dismiss button for SFSafariViewController")
		}
	}
}
