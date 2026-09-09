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
		app.element(matching: TestIdentifiers.Dictionary.definitionSheet)
	}

	private var searchField: XCUIElement {
		app.searchFields.firstMatch
	}

	@discardableResult
	func navigate() -> Self {
		navigateFromHome(to: TestIdentifiers.Buttons.dictionary)
	}

	@discardableResult
	func search(for text: String) -> Self {
		XCTAssertTrue(
			searchField.waitForExistence(timeout: 30),
			"the dictionary should offer a search field")
		searchField.tap()
		searchField.typeText(text)

		// The field holds the query, so read it back: a test that typed into
		// nothing would filter nothing and still find the first row.
		XCTAssertEqual(
			searchField.value as? String, text,
			"typing should put the query in the search field")

		// The keyboard covers the lower half of the results, and a row it hides
		// is neither rendered nor hittable.
		app.keyboards.buttons["search"].firstMatch.tap()
		return self
	}

	/// Opens an entry by name. Distinct from `openFirstWord`, which takes
	/// whatever happens to be at the top of the list.
	@discardableResult
	func openWord(_ word: String) -> Self {
		// A query matches every entry that *mentions* the word, not just the
		// entry named for it, so the row wanted can sit well down the results
		// -- and a SwiftUI List gives XCUITest nothing to match until the row
		// is actually rendered. Scroll until it is.
		//
		// A row reads its headword and then its definition preview as one
		// label, so match the start of it rather than the whole thing.
		let row = app.elementWithLabel(startingWith: word)
		scrollUntilExists(row)
		XCTAssertTrue(row.exists, "no row for \(word)")
		row.tap()
		return self
	}

	/// The phonetics a dictionary sets between pipes, next to the headword.
	@discardableResult
	func verifyPronunciation(_ ipa: String) -> Self {
		let phonetics = app.staticTexts["| \(ipa) |"]
		XCTAssertTrue(
			phonetics.waitForExistence(timeout: 5),
			"the sheet showed no phonetics for \(ipa)")
		return self
	}

	@discardableResult
	func verifyPartOfSpeech(_ part: String) -> Self {
		XCTAssertTrue(
			app.staticTexts[part].waitForExistence(timeout: 5),
			"the sheet showed no part of speech")
		return self
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
		let list = app.collectionViews[TestIdentifiers.Dictionary.list]
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
		let list = app.collectionViews[TestIdentifiers.Dictionary.list]
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
	/// The sheet's actions sit behind the ellipsis in the entry's own
	/// navigation bar, so reaching the editor takes two taps: open the menu,
	/// then choose from it.
	func openEditor() -> Self {
		let menu = app.navigationBars.buttons[TestIdentifiers.Dictionary.actionsMenu]
		XCTAssertTrue(menu.waitForExistence(timeout: 5), "the sheet had no actions menu")
		menu.tap()

		let button = app.buttons[TestIdentifiers.Dictionary.suggestAnEdit]
		XCTAssertTrue(button.waitForExistence(timeout: 5), "Suggest an Edit was not in the menu")
		button.tap()
		return self
	}

	@discardableResult
	func verifyEditorIsPresented() -> Self {
		let editor = app.element(matching: TestIdentifiers.Dictionary.editorSheet)
		XCTAssertTrue(editor.waitForExistence(timeout: 5), "the editor sheet never appeared")
		XCTAssertTrue(app.textFields[TestIdentifiers.Dictionary.wordField].exists, "the editor had no word field")
		return self
	}

	/// Taps the Word field, the only check this suite has for whether the
	/// keyboard covers the very fields it is editing -- a large-detent sheet
	/// leaves the least room to find out.
	@discardableResult
	func focusWordField() -> Self {
		app.textFields[TestIdentifiers.Dictionary.wordField].tap()
		XCTAssertTrue(
			app.keyboards.element.waitForExistence(timeout: 5), "the keyboard never appeared")
		return self
	}

	/// Dismisses the entry sheet by dragging it past the bottom of the screen,
	/// the gesture UIKit reads as a dismissal rather than a change of detent.
	@discardableResult
	func dismissEntrySheet() -> Self {
		app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.4))
			.press(
				forDuration: 0.1,
				thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 1.05)))
		return self
	}

	@discardableResult
	func verifyEntrySheetIsGone() -> Self {
		XCTAssertTrue(
			definitionSheet.waitForNonExistence(timeout: 5),
			"the entry sheet stayed up after the dismiss gesture"
		)
		return self
	}
}
