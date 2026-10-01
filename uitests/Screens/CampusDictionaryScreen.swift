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

	private var senseForm: XCUIElement {
		app.element(matching: TestIdentifiers.Dictionary.senseForm)
	}

	private var previewButton: XCUIElement {
		app.navigationBars.buttons[TestIdentifiers.Dictionary.preview]
	}

	private var discardChangesAlert: XCUIElement {
		app.alerts["Discard changes?"]
	}

	private var searchField: XCUIElement {
		app.searchFields.firstMatch
	}

	/// SwiftUI's native A-Z jumplist rail, iOS 26+ (`sectionIndexLabel()`, added
	/// via `patches/@expo__ui@57.0.14.patch`). It carries no per-letter
	/// accessibility elements -- it is one `Other` spanning every section -- so
	/// nothing here can query a specific letter, only the rail as a whole.
	private var sectionIndexRail: XCUIElement {
		app.otherElements["Section index"]
	}

	/// Drawn by this screen alone, so its presence says the screen has mounted.
	var mounted: XCUIElement {
		app.navigationBars["Dictionary"]
	}

	@discardableResult
	func navigate() -> Self {
		open(route: "/dictionary", mountedWhen: mounted)
	}

	/// Taps near the bottom of the section index rail and asserts the list
	/// actually scrolled. Cannot assert *which* section it landed on -- see
	/// `sectionIndexRail`. `sectionIndexLabel()` is iOS 26+, so this skips
	/// below that, where the rail does not exist at all.
	@discardableResult
	func verifySectionIndexRailScrolls() throws -> Self {
		guard #available(iOS 26.0, *) else {
			throw XCTSkip("sectionIndexLabel() needs iOS 26; the rail does not exist below it")
		}

		let list = app.collectionViews[TestIdentifiers.Dictionary.list]
		XCTAssertTrue(list.waitForExistence(timeout: 10), "the dictionary list never appeared")
		XCTAssertTrue(
			sectionIndexRail.waitForExistence(timeout: 10),
			"no section index rail appeared -- sectionIndexLabel needs iOS 26")
		capture("Dictionary with a section index rail")

		let firstRowBefore = list.buttons.firstMatch.label

		sectionIndexRail.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.95)).tap()

		let firstRowAfter = list.buttons.firstMatch.label
		XCTAssertNotEqual(
			firstRowAfter, firstRowBefore,
			"tapping near the bottom of the section index rail should scroll the list")
		return self
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

	/// Asserts the first entry's row is on screen without any scrolling. A list
	/// that keeps its old scroll offset when a search replaces its rows leaves
	/// the earliest results above the top of the screen, never rendered.
	@discardableResult
	func verifyFirstEntryIsOnScreen() -> Self {
		let row = app.elementWithLabel(startingWith: TestIdentifiers.Dictionary.firstEntry)
		_ = row.waitForExistence(timeout: 5)
		capture("Dictionary search results")
		XCTAssertTrue(
			row.exists && row.isHittable,
			"the results should start at \(TestIdentifiers.Dictionary.firstEntry), not wherever the list was scrolled before the search")
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

	/// A lone sense has no number hanging in a gutter, so its text should
	/// start at the headword's left edge rather than stepping in past it.
	@discardableResult
	func verifySenseAlignsWithHeadword(_ word: String, definition: String) -> Self {
		let sheetTexts = app.staticTexts.matching(
			identifier: TestIdentifiers.Dictionary.definitionSheet)
		let headword = sheetTexts.matching(NSPredicate(format: "label == %@", word)).firstMatch
		let sense = sheetTexts.matching(
			NSPredicate(format: "label BEGINSWITH %@", definition)
		).firstMatch
		XCTAssertTrue(headword.waitForExistence(timeout: 5), "the sheet showed no headword")
		XCTAssertTrue(sense.exists, "the sheet showed no definition")

		XCTAssertEqual(
			sense.frame.minX, headword.frame.minX, accuracy: 1,
			"the definition did not line up with the headword")
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
	/// Taps Suggest an Edit in the entry's own navigation bar.
	func openEditor() -> Self {
		let button = app.navigationBars.buttons[TestIdentifiers.Dictionary.suggestAnEdit]
		XCTAssertTrue(button.waitForExistence(timeout: 5), "the sheet had no Suggest an Edit button")
		button.tap()
		return self
	}

	/// Opens the sense in row `position`, counting from 1.
	@discardableResult
	func openSense(_ position: Int) -> Self {
		let row = app.element(matching: TestIdentifiers.Dictionary.senseRow(position))
		scrollUntilExists(row)
		XCTAssertTrue(row.waitForExistence(timeout: 15), "sense row \(position) never appeared")
		row.tap()
		XCTAssertTrue(
			senseForm.waitForExistence(timeout: 15),
			"tapping sense row \(position) should open that sense")
		return self
	}

	/// Types into the sense screen's definition field and reads it back, so a
	/// dropped keystroke or a field that lost focus mid-type fails outright
	/// rather than leaving whatever string survived.
	///
	/// Named `prepending`: a tap on a wrapped, multi-line `TextField` lands
	/// the caret at the start of the existing text, not the end.
	@discardableResult
	func typeDefinition(prepending text: String) -> Self {
		// Typed, not `element(matching:)`: the sense screen's "Definition"
		// section title is a StaticText carrying the same accessibility label
		// as the field itself and precedes it in the tree, so a type-agnostic
		// query resolves to the header, which takes no taps.
		let field = app.textFields[TestIdentifiers.Dictionary.senseDefinitionField]
		XCTAssertTrue(
			field.waitForExistence(timeout: 15), "the sense's definition field never appeared")

		// An empty `TextField` reads its placeholder back as its value, the
		// same quirk `searchField` has (see uitests/CLAUDE.md) -- and this
		// field's placeholder is the same string as its own accessibility
		// label. A sense `addSense` just opened has a genuinely empty field,
		// so that placeholder means no existing text, not literal content to
		// prepend to.
		let rawBefore = (field.value as? String) ?? ""
		let before = rawBefore == TestIdentifiers.Dictionary.senseDefinitionField ? "" : rawBefore

		field.tap()
		XCTAssertTrue(
			app.keyboards.firstMatch.waitForExistence(timeout: 10),
			"tapping the definition field should raise the keyboard -- if it did not, the field "
				+ "is not taking taps")

		field.typeText(text)

		let after = field.value as? String
		XCTAssertEqual(
			after, text + before,
			"typing should have left \"\(text)\" prepended to whatever the field already held -- got "
				+ "\(String(describing: after)), which means a keystroke was dropped or the field "
				+ "lost focus mid-type")
		return self
	}

	/// Adds a sub-sense to the sense on screen, which should open it.
	@discardableResult
	func addSubsense() -> Self {
		let button = app.buttons[TestIdentifiers.Dictionary.addSubsense]
		scrollUntilExists(button)
		XCTAssertTrue(button.waitForExistence(timeout: 15), "the sense had no Add Sub-sense button")
		button.tap()
		XCTAssertTrue(
			senseForm.waitForExistence(timeout: 15), "adding a sub-sense should show a sense form")
		return self
	}

	/// Returns to the edit form from a sense. The back button sits in the
	/// navigation bar at the top of the screen, which the keyboard never
	/// reaches even when it is up, so no scroll is needed -- whether or not
	/// this call followed any typing.
	///
	/// Scoped to the sense form's own bar: on iOS 27 an unscoped
	/// `navigationBars["Back"]` matches more than one bar at once.
	@discardableResult
	func leaveSense() -> Self {
		let back = app.navigationBars[TestIdentifiers.Dictionary.senseFormTitle]
			.buttons[TestIdentifiers.Navigation.backButton]
		XCTAssertTrue(back.waitForExistence(timeout: 15), "the sense form had no back button")
		back.tap()
		XCTAssertTrue(
			editForm.waitForExistence(timeout: 15), "Back should return to the edit form")
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
	/// stack, rather than presenting some other way. A back button on the
	/// form's own bar is what a plain modal would not have -- the same
	/// discriminator `HoursScreen.verifyReportPushedIntoSheet` uses for the
	/// building-hours report screen, scoped the same way, because the list's
	/// bar behind the sheet carries a button with this label too.
	@discardableResult
	func verifyEditFormPushedIntoSheet() -> Self {
		XCTAssertTrue(editForm.waitForExistence(timeout: 15), "the edit form never appeared")

		let back = app.navigationBars[TestIdentifiers.Dictionary.editFormTitle]
			.buttons[TestIdentifiers.Navigation.backButton]
		XCTAssertTrue(
			back.exists && back.isHittable,
			"the edit form should push into the sheet's stack, so it carries a back button")
		return self
	}

	/// Edits the first sense's definition, which now means opening that sense
	/// and typing on its own screen. The read-back inside `typeDefinition` is
	/// this suite's detector for a write race in the field; see the caller's
	/// comment for the length it takes to trip one.
	@discardableResult
	func editFirstDefinition(prepending text: String) -> Self {
		return openSense(1).typeDefinition(prepending: text).leaveSense()
	}

	/// Scrolls the edit form until `text` is on screen and unobstructed. The
	/// Senses section's footer -- the last thing in the form -- sits below the
	/// fold on return from a sense screen, so a capture taken where
	/// `editFirstDefinition` leaves off shows neither the footer nor the
	/// wording it carries.
	///
	/// A press-and-drag between two fixed points inside the form's own
	/// content, rather than `app.swipeUp()`. A swipe spans the whole element
	/// it is sent to, so sent to `app` its start and end points are computed
	/// from the app's full frame rather than the form's own bounds -- and
	/// this helper then reports content that was scrollable all along as
	/// unreachable if either point misses the form.
	@discardableResult
	func revealInForm(_ text: String) -> Self {
		let label = app.staticTexts[text]
		// Both ends lie inside the form's own content, between the navigation
		// bar and the bottom of the screen.
		let start = app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.43))
		let end = app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.18))
		for _ in 1...8 {
			if label.exists && label.isHittable {
				return self
			}
			start.press(forDuration: 0.05, thenDragTo: end)
		}
		XCTFail(
			label.exists
				? "\"\(text)\" is in the form but never became hittable -- something is drawn "
					+ "over it"
				: "eight drags up the form never produced an element reading \"\(text)\"")
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

	/// Asserts the preview container is up. On its own this proves nothing
	/// about what is drawn inside it -- `dictionary-preview-sheet` sits on the
	/// outer `VStack` (`entry-diff.tsx`), which exists whether or not a single
	/// run rendered -- so this is a precondition for `verifyPreviewShows`, not
	/// a substitute for it.
	@discardableResult
	func verifyPreviewPresented() -> Self {
		XCTAssertTrue(previewSheet.waitForExistence(timeout: 15), "the preview never appeared")
		return self
	}

	/// Asserts some element inside the preview carries `text` in its label.
	/// This is the one check that words actually survived `@expo/ui`'s `Text`
	/// concatenation: its whitelist keeps only strings and literal `Text`
	/// elements, so a marked run built any other way is dropped silently, and
	/// `verifyPreviewPresented` would keep passing over a blank screen.
	///
	/// Matched on the preview's own identifier as well as the label. The
	/// identifier is set on a `VStack`, which has no view of its own to carry
	/// it, so it flattens onto every descendant element (the same behaviour
	/// `definitionSheet` documents) -- which is what makes it usable as a
	/// scope here. Without it this query would also reach the entry sheet
	/// still sitting underneath in the navigation stack, and would find the
	/// entry's own wording there whether or not the diff drew anything.
	@discardableResult
	func verifyPreviewShows(_ text: String) -> Self {
		let element = app.descendants(matching: .any).matching(
			NSPredicate(
				format: "identifier == %@ AND label CONTAINS %@",
				TestIdentifiers.Dictionary.previewSheet, text)
		).firstMatch
		XCTAssertTrue(
			element.waitForExistence(timeout: 15),
			"the preview should show \"\(text)\" -- if it is missing, @expo/ui's Text silently "
				+ "dropped a run")
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

	/// Taps Add Sense, types `text` into the sense it opens if given, and
	/// returns to the form. Retries the tap:
	/// a tap can land on an already-hittable button before its action has
	/// reached JavaScript, and be lost entirely.
	///
	/// `position` is the row the new sense should occupy, counting from 1 --
	/// asserted after the return, so a tap that added nothing fails here
	/// rather than in whatever ran next.
	///
	/// The field a new sense opens is empty, so `typeDefinition`'s read-back
	/// there is exactly what was typed.
	@discardableResult
	func addSense(expectingRow position: Int = 2, withDefinition text: String? = nil) -> Self {
		let button = app.buttons[TestIdentifiers.Dictionary.addSense]
		scrollUntilExists(button)
		XCTAssertTrue(button.waitForExistence(timeout: 15), "the edit form should offer Add Sense")

		for _ in 1...3 {
			button.tap()
			guard senseForm.waitForExistence(timeout: 5) else { continue }

			if let text {
				typeDefinition(prepending: text)
			}

			leaveSense()
			let row = app.element(matching: TestIdentifiers.Dictionary.senseRow(position))
			XCTAssertTrue(
				row.waitForExistence(timeout: 15),
				"Add Sense should have left a row at position \(position)")
			return self
		}
		XCTFail("tapping Add Sense never opened the sense it added")
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
	/// drag `HoursScreen.attemptToDragSheetClosed` uses on the building-hours
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
