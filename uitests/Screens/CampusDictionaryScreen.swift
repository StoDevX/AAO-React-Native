import XCTest

struct CampusDictionaryScreen: Screen {
	let app: XCUIApplication

	/// A plain SwiftUI `VStack` has no view of its own to hang an accessibility
	/// identifier on -- unlike `List`, which backs onto a real
	/// `UICollectionView` and so gives `dictionary-list` one container to
	/// attach to, `accessibilityIdentifier('dictionary-definition-sheet')` on
	/// the VStack is flattened onto every descendant accessibility element
	/// instead (the headword, every sense, all separately carry it).
	/// `otherElements["dictionary-definition-sheet"]` therefore
	/// matches nothing, since none of those descendants is typed `.other`.
	/// `element(matching:)` is type-agnostic and takes the first match, which
	/// is enough to prove the sheet is up and to read its top edge.
	private var definitionSheet: XCUIElement {
		app.element(matching: TestIdentifiers.Dictionary.definitionSheet)
	}

	private var editForm: XCUIElement {
		app.element(matching: TestIdentifiers.Dictionary.editForm)
	}

	private var previewSheet: XCUIElement {
		app.element(matching: TestIdentifiers.Dictionary.previewSheet)
	}

	private var previewButton: XCUIElement {
		app.navigationBars.buttons[TestIdentifiers.Dictionary.preview]
	}

	private var reorderButton: XCUIElement {
		app.navigationBars.buttons[TestIdentifiers.Dictionary.reorder]
	}

	private var discardChangesAlert: XCUIElement {
		app.alerts["Discard changes?"]
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

	/// Asserts the edit form actually pushed into the entry sheet's own
	/// stack, rather than presenting some other way. Its Back button, which
	/// carries the sheet's nested-stack label, is what a plain modal would
	/// not have -- the same discriminator `CampusScreen.verifyReportPushedIntoSheet`
	/// uses for the building-hours report screen.
	@discardableResult
	func verifyEditFormPushedIntoSheet() -> Self {
		XCTAssertTrue(editForm.waitForExistence(timeout: 15), "the edit form never appeared")

		let back = app.navigationBars.buttons[TestIdentifiers.Navigation.backButton]
		XCTAssertTrue(
			back.exists && back.isHittable,
			"the edit form should push into the sheet's stack, so it carries a back button")
		return self
	}

	/// Types into the first sense's definition field and confirms the
	/// keyboard actually rose -- the one check this suite has that the field
	/// takes taps at all, since it sits in a row beside a separate "Options"
	/// chevron `Button`, and whether a `TextField` still responds sharing a
	/// row with a `Button` was unproven before this test ran.
	@discardableResult
	func editFirstDefinition(appending text: String) -> Self {
		let field = app.element(matching: TestIdentifiers.Dictionary.definitionField)
		XCTAssertTrue(
			field.waitForExistence(timeout: 15), "the first definition field never appeared")
		field.tap()

		XCTAssertTrue(
			app.keyboards.firstMatch.waitForExistence(timeout: 10),
			"tapping the definition field should raise the keyboard -- if it did not, the field "
				+ "beside the Options chevron is not taking taps")

		field.typeText(text)
		return self
	}

	@discardableResult
	func verifyPreviewDisabled() -> Self {
		XCTAssertTrue(
			previewButton.waitForExistence(timeout: 15), "the edit form should offer Preview")
		XCTAssertFalse(
			previewButton.isEnabled,
			"Preview should stay disabled until something in the draft has actually changed")
		return self
	}

	@discardableResult
	func verifyPreviewEnabled() -> Self {
		XCTAssertTrue(
			previewButton.waitForExistence(timeout: 15), "the edit form should offer Preview")
		XCTAssertTrue(
			previewButton.isEnabled,
			"Preview should enable once the draft has an actual change")
		return self
	}

	@discardableResult
	func openPreview() -> Self {
		XCTAssertTrue(
			previewButton.isEnabled, "Preview should be enabled before it can be opened")
		previewButton.tap()
		return self
	}

	@discardableResult
	func verifyPreviewPresented() -> Self {
		XCTAssertTrue(previewSheet.waitForExistence(timeout: 15), "the preview never appeared")
		return self
	}

	/// Asserts the DEBUG-only marker `@expo/ui` splices into a sentence when a
	/// modifier falls outside its nested-`Text` whitelist never appears. Our
	/// patch (`patches/@expo__ui@57.0.14.patch`) adds `strikethrough` and
	/// `underline` to that whitelist; this is what would prove the patch had
	/// come loose. Matched by `CONTAINS`, not a prefix match -- SwiftUI
	/// collapses a run of nested `Text` into one accessibility element, so the
	/// marker can only ever appear mid-sentence, never start one.
	@discardableResult
	func verifyNoUnsupportedNestedModifierMarker() -> Self {
		let marker = app.descendants(matching: .any).matching(
			NSPredicate(
				format: "label CONTAINS %@",
				TestIdentifiers.Dictionary.unsupportedNestedModifier)
		).firstMatch
		XCTAssertFalse(
			marker.exists,
			"the preview should never show "
				+ "\"\(TestIdentifiers.Dictionary.unsupportedNestedModifier)\" -- that means a "
				+ "modifier fell out of @expo/ui's nested-Text whitelist")
		return self
	}

	@discardableResult
	func addSense() -> Self {
		let button = app.buttons[TestIdentifiers.Dictionary.addSense]
		scrollUntilExists(button)
		XCTAssertTrue(button.waitForExistence(timeout: 15), "the edit form should offer Add Sense")
		button.tap()
		return self
	}

	@discardableResult
	func verifyReorderToggleVisible() -> Self {
		XCTAssertTrue(
			reorderButton.waitForExistence(timeout: 15),
			"the Reorder toggle should appear once the entry has two or more senses")
		return self
	}

	@discardableResult
	func toggleReorderMode() -> Self {
		XCTAssertTrue(
			reorderButton.waitForExistence(timeout: 15),
			"Reorder should exist before it can be toggled")
		reorderButton.tap()
		return self
	}

	/// Asserts SwiftUI actually drew a reorder handle for each sense once
	/// `editMode` went active -- `ForEach`'s `onMove` inside a `Form` is the
	/// one piece of this flow the plan has no fallback for, so this is a real
	/// check of the drawn hierarchy, not a proxy for the toggle having been
	/// tapped. Captures a screenshot and the accessibility tree as attachments
	/// -- `keepAlways`, same as `Screen.capture` -- so a failure here can be
	/// read from the result bundle rather than re-run to find out what
	/// happened; a bare `print` of `debugDescription` does not survive into
	/// the bundle at all.
	@discardableResult
	func verifyReorderHandlesAppear(senseCount expectedCount: Int) -> Self {
		capture("Dictionary form in reorder mode")

		let treeDump = XCTAttachment(string: app.debugDescription)
		treeDump.name = "Reorder mode accessibility tree"
		treeDump.lifetime = .keepAlways
		XCTContext.runActivity(named: "Reorder mode accessibility tree") { $0.add(treeDump) }

		// Scoped to the form itself, not `app` at large -- an unscoped query
		// for a "Reorder"-labelled button also matches the toolbar's own
		// toggle, which sits in the navigation bar rather than in the List,
		// and would pass this assertion whether or not the List drew a single
		// drag handle. Asserting an exact count, not merely `> 0`, closes the
		// same loophole a second way: a query that happened to still catch the
		// toolbar button alongside zero real handles would read as "greater
		// than zero" too.
		let handles = editForm.descendants(matching: .any).matching(
			NSPredicate(format: "label CONTAINS[c] %@", "Reorder"))
		XCTAssertEqual(
			handles.count, expectedCount,
			"toggling Reorder should draw one drag handle per sense inside the form itself (the "
				+ "toolbar's own Reorder toggle does not count) -- found \(handles.count), wanted "
				+ "\(expectedCount)")
		return self
	}

	@discardableResult
	func verifyDiscardChangesAlertPresented() -> Self {
		XCTAssertTrue(
			discardChangesAlert.waitForExistence(timeout: 15),
			"the unsaved-changes guard should have raised its alert")
		return self
	}

	/// Cancels the discard, staying on the form with edits intact.
	@discardableResult
	func chooseToKeepEditing() -> Self {
		discardChangesAlert.buttons["Edit"].tap()
		return self
	}

	/// Attempts to drag the edit form's sheet closed -- the same downward
	/// drag `CampusScreen.attemptToDragSheetClosed` uses on the building-hours
	/// report screen, past the bottom of the screen so UIKit reads it as a
	/// dismissal rather than a detent change.
	@discardableResult
	func attemptToDragSheetClosed() -> Self {
		app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.4))
			.press(
				forDuration: 0.1,
				thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 1.05)))
		return self
	}
}
