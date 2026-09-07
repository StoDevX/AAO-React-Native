import XCTest

struct CampusDictionaryScreen: Screen {
	let app: XCUIApplication

	/// A plain SwiftUI `VStack` has no view of its own to hang an accessibility
	/// identifier on -- unlike `List`, which backs onto a real
	/// `UICollectionView` and so gives `dictionary-list` one container to
	/// attach to, `accessibilityIdentifier('dictionary-definition-sheet')` on
	/// the VStack is flattened onto every descendant accessibility element
	/// instead (the title, the close button, the body text, all separately
	/// carry it). `otherElements["dictionary-definition-sheet"]` therefore
	/// matches nothing, since none of those descendants is typed `.other`.
	/// `element(matching:)` is type-agnostic and takes the first match, which
	/// is enough to prove the sheet is up and to read its top edge.
	private var definitionSheet: XCUIElement {
		app.element(matching: "dictionary-definition-sheet")
	}

	@discardableResult
	func navigate() -> Self {
		navigateFromHome(to: TestIdentifiers.Buttons.dictionary)
	}

	@discardableResult
	func verifyCampusDictionaryTitle() -> Self {
		verifyTitle(TestIdentifiers.Buttons.dictionary)
	}

	@discardableResult
	func openFirstWord() -> Self {
		// A SwiftUI List backs onto a UICollectionView on current iOS, but that
		// is an implementation detail rather than a promise. If this query
		// finds nothing on the first run, dump `app.debugDescription` and use
		// whichever element type actually carries the identifier.
		let list = app.collectionViews["dictionary-list"]
		XCTAssertTrue(list.waitForExistence(timeout: 10), "the dictionary list never appeared")

		let firstWord = list.buttons.firstMatch
		XCTAssertTrue(firstWord.waitForExistence(timeout: 10), "the list had no entries")
		firstWord.tap()
		return self
	}

	/// Opens the list's second entry -- a different word from whatever
	/// `openFirstWord` opened. The detent-reset regression test needs two
	/// distinct entries: it opens the *next* one after closing the first, and
	/// asserts that sheet comes back at `medium` rather than carrying over
	/// whatever detent the first was left at.
	@discardableResult
	func openSecondWord() -> Self {
		let list = app.collectionViews["dictionary-list"]
		XCTAssertTrue(list.waitForExistence(timeout: 10), "the dictionary list never appeared")

		let secondWord = list.buttons.element(boundBy: 1)
		XCTAssertTrue(
			secondWord.waitForExistence(timeout: 10), "the list had fewer than two entries")
		secondWord.tap()
		return self
	}

	@discardableResult
	func verifyDefinitionSheetIsPresented() -> Self {
		XCTAssertTrue(
			definitionSheet.waitForExistence(timeout: 5), "the definition sheet never appeared")
		return self
	}

	/// The sheet's top edge should sit near the middle of the screen, not at
	/// the top of it -- which is the whole point of a `medium` detent.
	@discardableResult
	func verifySheetIsHalfHeight() -> Self {
		let screen = app.windows.firstMatch.frame
		let top = definitionSheet.frame.minY

		print("DEBUG app.frame = \(app.frame)")
		print("DEBUG app.windows.firstMatch.frame = \(screen)")
		print("DEBUG definitionSheet.frame = \(definitionSheet.frame)")

		XCTAssertGreaterThan(
			top, screen.height * 0.3,
			"the sheet reached higher than a medium detent should"
		)
		XCTAssertLessThan(
			top, screen.height * 0.7,
			"the sheet sat lower than a medium detent should"
		)
		return self
	}

	/// Drags the sheet from its `medium` resting point up to `large`, the way
	/// a person would to read a long entry. The start point is inside the
	/// sheet's own chrome near its top edge (below the medium detent's line,
	/// which `verifySheetIsHalfHeight` pins between 30% and 70% of the screen)
	/// rather than on the drag indicator itself, which is too thin a target to
	/// aim at reliably.
	@discardableResult
	func dragSheetToLargeDetent() -> Self {
		app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.55))
			.press(
				forDuration: 0.1,
				thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.05)))
		return self
	}

	/// The sheet's top edge should sit near the top of the screen once dragged
	/// to `large`. This is the precondition the detent-reset regression test
	/// needs: if the drag never actually reached `large`, closing and
	/// reopening at `medium` would prove nothing.
	@discardableResult
	func verifySheetIsLargeHeight() -> Self {
		let screen = app.windows.firstMatch.frame
		let top = definitionSheet.frame.minY

		XCTAssertLessThan(
			top, screen.height * 0.15,
			"the sheet never reached a large detent"
		)
		return self
	}

	@discardableResult
	/// The sheet's actions sit behind the ellipsis in the title row, so reaching
	/// the editor takes two taps: open the menu, then choose from it.
	func openEditor() -> Self {
		let menu = app.buttons["More actions"]
		XCTAssertTrue(menu.waitForExistence(timeout: 5), "the sheet had no actions menu")
		menu.tap()

		let button = app.buttons["Suggest an Edit"]
		XCTAssertTrue(button.waitForExistence(timeout: 5), "Suggest an Edit was not in the menu")
		button.tap()
		return self
	}

	@discardableResult
	func verifyEditorIsPresented() -> Self {
		let editor = app.element(matching: "dictionary-editor-sheet")
		XCTAssertTrue(editor.waitForExistence(timeout: 5), "the editor sheet never appeared")
		XCTAssertTrue(app.textFields["Word"].exists, "the editor had no word field")
		return self
	}

	/// Taps the Word field, the only check this suite has for whether the
	/// keyboard covers the very fields it is editing -- a large-detent sheet
	/// leaves the least room to find out.
	@discardableResult
	func focusWordField() -> Self {
		app.textFields["Word"].tap()
		XCTAssertTrue(
			app.keyboards.element.waitForExistence(timeout: 5), "the keyboard never appeared")
		return self
	}

	@discardableResult
	func closeDefinitionSheet() -> Self {
		app.buttons["Close"].tap()
		return self
	}

	@discardableResult
	func verifyDefinitionSheetIsGone() -> Self {
		XCTAssertTrue(
			definitionSheet.waitForNonExistence(timeout: 5),
			"the definition sheet stayed up after Close"
		)
		return self
	}
}
