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

	/// Find a button by the label UIKit gave it, matching on the label alone.
	///
	/// The plain subscript is not confined to identifiers: it answers with a
	/// system button that has only a label, which is how `CarletonMapScreen`
	/// reaches the search bar's Close button. What it will not do is tell the
	/// two attributes apart, so use this wherever a label is the only thing
	/// that should count.
	func buttonLabelled(_ label: String) -> XCUIElement {
		buttons.matching(NSPredicate(format: "label == %@", label)).firstMatch
	}

	/// Find a link by its label. A row that leaves the app reads as a link,
	/// not a button, so `buttonLabelled` does not find it.
	func linkLabelled(_ label: String) -> XCUIElement {
		links.matching(NSPredicate(format: "label == %@", label)).firstMatch
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

	/// Wait for this element to become hittable: on screen, and not covered.
	/// A readiness check before a single tap, so a control that drops its first
	/// tap fails the test instead of being tapped again.
	func waitForHittable(timeout: TimeInterval = 30) -> Bool {
		let expectation = XCTNSPredicateExpectation(
			predicate: NSPredicate(format: "isHittable == true"), object: self)
		return XCTWaiter().wait(for: [expectation], timeout: timeout) == .completed
	}
}

/// The RGB values of a screenshot, addressed in points.
struct ScreenPixels {
	struct Colour {
		let red: Int
		let green: Int
		let blue: Int

		/// Within a step or two per channel, which absorbs the colour-space
		/// conversion without letting a light glyph over a light page through.
		func isClose(to other: Colour) -> Bool {
			abs(red - other.red) <= 2 && abs(green - other.green) <= 2 && abs(blue - other.blue) <= 2
		}
	}

	private let bytes: [UInt8]
	private let width: Int
	private let scale: CGFloat

	init?(_ image: UIImage) {
		guard let cgImage = image.cgImage else { return nil }
		let width = cgImage.width
		let height = cgImage.height
		// Drawing inside withUnsafeMutableBytes keeps the buffer's address valid
		// for as long as the context writes through it.
		var bytes = [UInt8](repeating: 0, count: width * height * 4)
		let drawn = bytes.withUnsafeMutableBytes { buffer -> Bool in
			guard
				let context = CGContext(
					data: buffer.baseAddress, width: width, height: height, bitsPerComponent: 8,
					bytesPerRow: width * 4, space: CGColorSpaceCreateDeviceRGB(),
					bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)
			else { return false }
			context.draw(cgImage, in: CGRect(x: 0, y: 0, width: width, height: height))
			return true
		}
		guard drawn else { return nil }
		self.bytes = bytes
		self.width = width
		self.scale = CGFloat(width) / image.size.width
	}

	func colour(at point: CGPoint) -> Colour {
		let index = (Int(point.y * scale) * width + Int(point.x * scale)) * 4
		return Colour(red: Int(bytes[index]), green: Int(bytes[index + 1]), blue: Int(bytes[index + 2]))
	}

	/// The share of `region` whose colour differs between this screenshot and
	/// `other`, sampled every two points: 0 for the same picture, near 1 for
	/// an unrelated one.
	func fractionDiffering(from other: ScreenPixels, in region: CGRect) -> Double {
		var sampled = 0
		var differing = 0
		for y in stride(from: region.minY, to: region.maxY, by: 2) {
			for x in stride(from: region.minX, to: region.maxX, by: 2) {
				let point = CGPoint(x: x, y: y)
				sampled += 1
				if !colour(at: point).isClose(to: other.colour(at: point)) {
					differing += 1
				}
			}
		}
		return sampled == 0 ? 0 : Double(differing) / Double(sampled)
	}
}
