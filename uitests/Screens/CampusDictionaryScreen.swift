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

	/// The drag handles SwiftUI draws inside the form once `editMode` goes
	/// active. Scoped to the form itself, not `app` at large -- an unscoped
	/// query for a "Reorder"-labelled element also matches the toolbar's own
	/// toggle, which sits in the navigation bar rather than in the List, and
	/// would answer for it whether or not the List drew a single handle.
	private var reorderHandles: XCUIElementQuery {
		editForm.descendants(matching: .any).matching(
			NSPredicate(format: "label CONTAINS[c] %@", "Reorder"))
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
	/// takes taps at all. This field sits in a flat list, separate from the
	/// "Options" chevron buttons below it (see the two-`.map()` layout in
	/// `edit.tsx`); it proves that flat layout takes taps, not the in-row
	/// arrangement the same comment leaves open as a separate question.
	///
	/// Named `prepending`, not `appending`: a tap on this field -- a wrapped,
	/// multi-line `TextField` -- lands the caret at the very start of its
	/// existing text, not the end, so typed text is inserted before it, not
	/// after. Reads the field's value back both before and after typing and
	/// asserts they combine exactly as `text + before`, so a dropped keystroke
	/// or a field that lost keyboard focus mid-type fails the test outright
	/// rather than quietly leaving whatever string survived. That read-back is
	/// this suite's detector for the write race `SenseDefinitionField` guards
	/// against; see the caller's comment for the length it takes to trip it.
	@discardableResult
	func editFirstDefinition(prepending text: String) -> Self {
		let field = app.element(matching: TestIdentifiers.Dictionary.firstDefinitionField)
		XCTAssertTrue(
			field.waitForExistence(timeout: 15), "the first definition field never appeared")
		let before = (field.value as? String) ?? ""

		field.tap()
		XCTAssertTrue(
			app.keyboards.firstMatch.waitForExistence(timeout: 10),
			"tapping the definition field should raise the keyboard -- if it did not, the field "
				+ "is not taking taps")

		field.typeText(text)

		let after = field.value as? String
		XCTAssertEqual(
			after, text + before,
			"typing should have prepended \"\(text)\" to the field's existing text -- got "
				+ "\(String(describing: after)), which means a keystroke was dropped or the field "
				+ "lost focus mid-type")
		return self
	}

	/// Scrolls the edit form until `text` is on screen and unobstructed.
	/// After typing, the keyboard covers the bottom of the form -- including
	/// the Senses section's footer, the last thing in it -- so a capture taken
	/// where `editFirstDefinition` leaves off shows neither the footer nor the
	/// wording it carries. Swiping the form both dismisses the keyboard and
	/// scrolls, which is what lets one loop do both jobs.
	@discardableResult
	func revealInForm(_ text: String) -> Self {
		let label = app.staticTexts[text]
		for _ in 1...8 {
			if label.exists && label.isHittable {
				return self
			}
			app.swipeUp()
		}
		XCTFail("scrolling the form never revealed \"\(text)\"")
		return self
	}

	/// Types into a definition field `addSense()` produced -- unlike
	/// `editFirstDefinition`, those fields start empty, so there is no
	/// existing text to combine with: the field's value after typing is
	/// asserted to equal exactly what was typed.
	@discardableResult
	func fillDefinition(_ position: Int, with text: String) -> Self {
		let field = app.element(matching: TestIdentifiers.Dictionary.definitionField(position))
		XCTAssertTrue(
			field.waitForExistence(timeout: 15),
			"definition field \(position) never appeared")

		field.tap()
		XCTAssertTrue(
			app.keyboards.firstMatch.waitForExistence(timeout: 10),
			"tapping definition field \(position) should raise the keyboard")

		field.typeText(text)

		XCTAssertEqual(
			field.value as? String, text,
			"definition field \(position) should read back exactly what was typed")
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

	/// Drags the sheet from its resting detent up to the full-height one the
	/// route also allows. The resting detent leaves about a third of the
	/// screen for the preview, which is not enough to show a washed sense and
	/// an unwashed one together in a single still image.
	@discardableResult
	func expandSheetToFullHeight() -> Self {
		let grabber = app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.30))
		grabber.press(
			forDuration: 0.2,
			thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.02)))
		return self
	}

	/// Scrolls the preview until the run carrying `text` sits wholly inside
	/// the window. A sense the edit added comes after every sense the entry
	/// already had, so on this reference entry it starts below the fold --
	/// and an element only half on screen still reports as existing and
	/// hittable, which is why this measures the frame instead.
	@discardableResult
	func scrollPreviewInto(view text: String) -> Self {
		let element = app.descendants(matching: .any).matching(
			NSPredicate(
				format: "identifier == %@ AND label CONTAINS %@",
				TestIdentifiers.Dictionary.previewSheet, text)
		).firstMatch
		XCTAssertTrue(element.waitForExistence(timeout: 15), "the preview never showed \"\(text)\"")

		let window = app.windows.firstMatch.frame
		for _ in 1...8 {
			let frame = element.frame
			if frame.minY >= window.minY && frame.maxY <= window.maxY {
				return self
			}
			app.swipeUp()
		}
		XCTFail("scrolling the preview never brought \"\(text)\" wholly into view")
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

	/// Asserts the Reorder toggle is absent before there are two senses --
	/// the "change" reference entry has exactly one top-level sense, so this
	/// is meaningful the moment the form is up, before `addSense()` runs.
	@discardableResult
	func verifyReorderToggleHidden() -> Self {
		XCTAssertFalse(
			reorderButton.exists,
			"the Reorder toggle should stay hidden for a single-sense entry")
		return self
	}

	/// Taps Add Sense and confirms a second sense actually appeared, retrying
	/// the tap the way `navigateFromHome` does: a tap can land on an already
	/// -hittable button before its action has reached JavaScript, and be lost
	/// entirely.
	@discardableResult
	func addSense(expectingDefinition position: Int = 2) -> Self {
		let button = app.buttons[TestIdentifiers.Dictionary.addSense]
		scrollUntilExists(button)
		XCTAssertTrue(button.waitForExistence(timeout: 15), "the edit form should offer Add Sense")

		let newDefinition = app.element(matching: TestIdentifiers.Dictionary.definitionField(position))
		for _ in 1...3 {
			button.tap()
			if newDefinition.waitForExistence(timeout: 5) {
				return self
			}
		}
		XCTFail("tapping Add Sense never produced definition field \(position)")
		return self
	}

	@discardableResult
	func verifyReorderToggleVisible() -> Self {
		XCTAssertTrue(
			reorderButton.waitForExistence(timeout: 15),
			"the Reorder toggle should appear once the entry has two or more senses")
		return self
	}

	/// Asserts no drag handle exists yet, scoped the same way
	/// `verifyReorderHandlesAppear` is -- called after `addSense()` but
	/// before `toggleReorderMode()`, so a build that hard-coded `editMode`
	/// active (the same bug this suite already found once, in the other
	/// direction) would fail this rather than pass unnoticed.
	@discardableResult
	func verifyNoReorderHandlesYet() -> Self {
		let handles = reorderHandles
		XCTAssertEqual(
			handles.count, 0,
			"no drag handle should exist before Reorder is toggled on -- found \(handles.count)")
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

	/// Drags one sense's handle down onto the row below it, and lets go.
	///
	/// SwiftUI reports the drop as a destination counted against the list as
	/// it stood *before* the row was lifted out, so dropping the first row
	/// onto the second arrives as `2` even though the sense lands second.
	/// Nothing but a real drag exercises that: `onMove` never fires under
	/// Jest, and a mocked call there is only ever the number the test chose
	/// to pass.
	///
	/// Slow, with a hold at each end: a reorder drag has to press long enough
	/// for the List to pick the row up, and a flick released the moment it
	/// arrives is dropped back where it started.
	@discardableResult
	func dragSenseDownOneRow(from position: Int) -> Self {
		let source = reorderHandles.element(boundBy: position)
		let target = reorderHandles.element(boundBy: position + 1)
		XCTAssertTrue(
			source.waitForExistence(timeout: 15),
			"the form should draw a drag handle for sense \(position + 1)")
		XCTAssertTrue(
			target.waitForExistence(timeout: 15),
			"the form should draw a drag handle for sense \(position + 2)")

		source.press(
			forDuration: 0.8, thenDragTo: target, withVelocity: .slow, thenHoldForDuration: 1.0)
		return self
	}

	/// Reads each sense's definition back off the form, in form order.
	///
	/// The fields are labelled by position, so which field holds which text
	/// is precisely what a reorder changes -- and reading them back is the
	/// only way to see on screen where a drag actually put a sense.
	@discardableResult
	func verifyDefinitionOrder(_ expected: [String]) -> Self {
		capture("Dictionary edit form after a reorder drag")

		var actual: [String] = []
		for position in 1...expected.count {
			let field = app.element(matching: TestIdentifiers.Dictionary.definitionField(position))
			XCTAssertTrue(
				field.waitForExistence(timeout: 15),
				"the form should still show definition field \(position)")
			actual.append((field.value as? String) ?? "")
		}

		XCTAssertEqual(
			actual, expected,
			"the senses should read in the order the drag left them")
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

		// Asserting an exact count, not merely `> 0`, closes the loophole
		// `reorderHandles` scopes away a second time: a query that happened to
		// still catch the toolbar's own toggle alongside zero real handles
		// would read as "greater than zero" too.
		let handles = reorderHandles
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
