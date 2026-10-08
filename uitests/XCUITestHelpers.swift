import XCTest

extension XCUIApplication {
	/// Find an element by its accessibility identifier regardless of element type.
	/// React Native testID maps to accessibilityIdentifier, but the XCUITest
	/// element type varies depending on the component (button, other, cell, etc.).
	func element(matching identifier: String) -> XCUIElement {
		descendants(matching: .any)[identifier].firstMatch
	}

	/// Find a tab bar button by its visible label.
	///
	/// A tab's accessibility label can carry a suffix like ", tab, 1 of 3", so
	/// this matches on the start of the label rather than all of it. It looks
	/// only inside the tab bar: Menus titles its screen with a meal picker
	/// whose label also starts with the cafe's name ("The Cage, Sunday, ..."),
	/// and that button, which is never selected, came first in the tree.
	func tabButton(_ label: String) -> XCUIElement {
		tabBars.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", label)).firstMatch
	}

	/// Find a button by the label UIKit gave it, matching on the label alone.
	///
	/// The plain subscript is not confined to identifiers: it answers with a
	/// system button that has only a label, which is how `MapScreen`
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

/// How `waitUntil` spaces its checks: the first after 0.2s, each later one
/// half again as long as the last, and none more than 1s apart.
///
/// XCTest's own waits check about once a second, so a wait for something
/// that turns up a moment later overshoots by up to a second. Checking every
/// 0.1s takes that back but keeps a CPU busy with queries; the backoff keeps
/// the quick checks for a condition that is about to hold, and slows down for
/// one that is not. The longest gap is 1s, not the 2s Wealthfront used, so no
/// wait here checks less often than XCTest's did.
private enum Polling {
	static let firstInterval: TimeInterval = 0.2
	static let growth = 1.5
	static let longestInterval: TimeInterval = 1.0
}

/// Wait up to `timeout` seconds for `condition` to hold, and say whether it
/// did. The step shows in the test report as `activity`, so its time can be
/// read there as XCTest's own waits can.
///
/// Checks once before waiting at all, so a condition that already holds
/// costs one check. Then checks as `Polling` spaces them, with a last check
/// at the deadline. Spins the run loop between checks, as XCTest's waits do.
///
/// Reports no failure: a caller asserts on the result, so the message is its own.
func waitUntil(_ activity: String, timeout: TimeInterval, _ condition: () -> Bool) -> Bool {
	XCTContext.runActivity(named: activity) { _ in
		if condition() { return true }
		let deadline = Date().addingTimeInterval(timeout)
		var interval = Polling.firstInterval
		while true {
			let remaining = deadline.timeIntervalSinceNow
			if remaining <= 0 { return false }
			RunLoop.current.run(until: Date().addingTimeInterval(min(interval, remaining)))
			if condition() { return true }
			interval = min(interval * Polling.growth, Polling.longestInterval)
		}
	}
}

extension XCUIElement {
	/// `waitForExistence(timeout:)`, checking as `waitUntil` does.
	func waitUntilExists(timeout: TimeInterval) -> Bool {
		waitUntil("Waiting \(timeout)s for \(self) to exist", timeout: timeout) { exists }
	}

	/// `waitForNonExistence(timeout:)`, checking as `waitUntil` does.
	func waitUntilGone(timeout: TimeInterval) -> Bool {
		waitUntil("Waiting \(timeout)s for \(self) to not exist", timeout: timeout) { !exists }
	}

	/// Wait for this element to resolve to one that `matches`. Read from a
	/// snapshot, which throws for an element that is missing, so a missing
	/// element reads as "not yet" rather than failing the test.
	func waitUntilSnapshot(
		_ activity: String, timeout: TimeInterval, matches: (XCUIElementSnapshot) -> Bool
	) -> Bool {
		waitUntil("Waiting \(timeout)s for \(self) \(activity)", timeout: timeout) {
			(try? snapshot()).map(matches) ?? false
		}
	}

	/// Wait for this element to report the given selection state.
	///
	/// A selection is the far end of a round trip -- a tap reaches JavaScript,
	/// the filter state changes, and the control re-renders -- so it is never
	/// already settled when `tap()` returns. Polling rather than reading
	/// `isSelected` once is what separates "not yet" from "never".
	func waitForSelected(_ expected: Bool, timeout: TimeInterval = 30) -> Bool {
		waitUntilSnapshot(expected ? "to be selected" : "to be unselected", timeout: timeout) {
			$0.isSelected == expected
		}
	}

	/// Wait for this element to be enabled, or disabled. A control disabled by
	/// JavaScript state changes a render after the tap that changes the state.
	func waitForEnabled(_ expected: Bool, timeout: TimeInterval = 30) -> Bool {
		waitUntilSnapshot(expected ? "to be enabled" : "to be disabled", timeout: timeout) {
			$0.isEnabled == expected
		}
	}

	/// Wait for this element's label to read `expected`. A label drawn by JavaScript changes a
	/// render after the tap that asks for it.
	func waitForLabel(_ expected: String, timeout: TimeInterval = 30) -> Bool {
		waitUntilSnapshot("to read \(expected)", timeout: timeout) { $0.label == expected }
	}

	/// Wait for this element to become hittable: on screen, and not covered.
	/// A readiness check before a single tap, so a control that drops its first
	/// tap fails the test instead of being tapped again.
	///
	/// Hittability is not in a snapshot, so this reads it off the element,
	/// once the element exists.
	func waitForHittable(timeout: TimeInterval = 30) -> Bool {
		waitUntil("Waiting \(timeout)s for \(self) to be hittable", timeout: timeout) {
			exists && isHittable
		}
	}
}

enum StringMatcher {
  case beginsWith(String)
  case contains(String)
  case endsWith(String)
  case equals(String)

  var predicateFormat: (format: String, value: String) {
    switch self {
    case .beginsWith(let str): return ("identifier BEGINSWITH %@", str)
    case .contains(let str):   return ("identifier CONTAINS %@", str)
    case .endsWith(let str):   return ("identifier ENDSWITH %@", str)
    case .equals(let str):     return ("identifier == %@", str)
    }
  }

  var nsPredicate: NSPredicate {
    let (format, value) = predicateFormat
    return NSPredicate(format: format, value)
  }
}

extension XCUIElementQuery {
  /// Filter elements by identifier using a type-safe StringMatcher
  func matching(_ matcher: StringMatcher) -> XCUIElementQuery {
    return self.matching(matcher.nsPredicate)
  }

  /// Collect just the accessibility identifiers from the query elements
  func identifiers() -> [String] {
    return allElementsBoundByIndex.map { $0.identifier }
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
