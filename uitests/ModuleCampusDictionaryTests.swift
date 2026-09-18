import XCTest

class ModuleCampusDictionaryTests: UITestCase {
	func testTappingTheSectionIndexRailScrollsTheList() throws {
		try CampusDictionaryScreen(app: app)
			.navigate()
			.verifySectionIndexRailScrolls()
	}

	func testTappingAWordOpensAHalfHeightSheet() throws {
		CampusDictionaryScreen(app: app)
			.navigate()
			.openFirstWord()
			.verifyDefinitionSheetIsPresented()
			.capture("Dictionary definition sheet")
			.verifySheetIsHalfHeight()
	}

	func testTheSheetCloses() throws {
		CampusDictionaryScreen(app: app)
			.navigate()
			.openFirstWord()
			.verifyDefinitionSheetIsPresented()
			.dismissEntrySheet()
			.verifyEntrySheetIsGone()
	}

	/// Suggest an Edit pushes the edit form into the entry sheet's own stack,
	/// rather than presenting some other way -- its own Back button is what
	/// proves that.
	func testTheFormPushesIntoTheEntrySheet() throws {
		CampusDictionaryScreen(app: app)
			.navigate()
			.search(for: TestIdentifiers.Dictionary.referenceEntry)
			.openWord(TestIdentifiers.Dictionary.referenceEntry)
			.verifyDefinitionSheetIsPresented()
			.openEditor()
			.verifyEditFormPushedIntoSheet()
			.capture("Dictionary edit form")
	}

	/// Preview should refuse to open until the draft actually differs from
	/// the entry as opened -- retyping nothing is not a suggestion.
	///
	/// `"indeed "` rather than a shorter word, here and in every other test
	/// that types into this field: a shorter burst does not reliably straddle
	/// the window in which a keystroke sent to a native text field can be
	/// dropped between renders. Seven characters is what it takes to trip that
	/// race reliably -- `editFirstDefinition`'s read-back of the field's value
	/// is what fails if one ever is.
	func testPreviewIsRefusedUntilSomethingChanges() throws {
		CampusDictionaryScreen(app: app)
			.navigate()
			.search(for: TestIdentifiers.Dictionary.referenceEntry)
			.openWord(TestIdentifiers.Dictionary.referenceEntry)
			.verifyDefinitionSheetIsPresented()
			.openEditor()
			.verifyEditFormPushedIntoSheet()
			.verifyPreviewDisabled()
			.editFirstDefinition(prepending: "indeed ")
			.verifyPreviewEnabled()
			// The form once an edit has landed. Its footer is the one place the
			// second wording is drawn, and it sits under the keyboard until the
			// form is scrolled -- so revealing it is what makes the capture show
			// the state this test just put the draft into.
			.revealInForm("Ready to preview")
			.capture("Dictionary edit form with a change made")
	}

	/// The whole point of the flow: an edit previews as a marked-up diff, with
	/// every word `@expo/ui`'s `Text` would otherwise have silently dropped
	/// still on screen, and no DEBUG marker standing in for markup our patch
	/// should have supported. `verifyPreviewShows` is the actual proof of
	/// that -- `verifyPreviewPresented` alone would pass against a completely
	/// blank preview, since its identifier sits on the outer container.
	func testAnEditIsPreviewedAsAMarkedUpDiff() throws {
		CampusDictionaryScreen(app: app)
			.navigate()
			.search(for: TestIdentifiers.Dictionary.referenceEntry)
			.openWord(TestIdentifiers.Dictionary.referenceEntry)
			.verifyDefinitionSheetIsPresented()
			.openEditor()
			.verifyEditFormPushedIntoSheet()
			.editFirstDefinition(prepending: "indeed ")
			.verifyPreviewEnabled()
			.openPreview()
			.verifyPreviewPresented()
			.capture("Dictionary suggestion diff")
			.verifyPreviewShows("something")
			.verifyPreviewShows("indeed")
			.verifyNoUnsupportedNestedModifierMarker()
	}

	/// A second sense is what makes reordering meaningful -- the toggle should
	/// stay hidden for a single-sense entry and appear once there are two, and
	/// no drag handle should exist until Reorder is actually toggled on. Both
	/// preconditions matter: without them this test would stay green even if
	/// `editMode` were hard-coded active, which is the bug this suite already
	/// found once, in the opposite direction.
	func testASecondSenseOffersReordering() throws {
		CampusDictionaryScreen(app: app)
			.navigate()
			.search(for: TestIdentifiers.Dictionary.referenceEntry)
			.openWord(TestIdentifiers.Dictionary.referenceEntry)
			.verifyDefinitionSheetIsPresented()
			.openEditor()
			.verifyEditFormPushedIntoSheet()
			.verifyReorderToggleHidden()
			.addSense()
			.verifyNoReorderHandlesYet()
			.verifyReorderToggleVisible()
			.capture("Dictionary edit form with two senses")
			.toggleReorderMode()
			.verifyReorderHandlesAppear(senseCount: 2)
	}

	/// The drag itself, and where it leaves the sense.
	/// `testASecondSenseOffersReordering` proves only that handles are drawn;
	/// until this test nothing anywhere performed a reorder and looked at the
	/// result, which is how a handler that put every downward drag one place
	/// too far survived to review.
	///
	/// Three senses, because two cannot tell a correct reorder from one that
	/// overshoots: drag the first of two rows down and it lands last either
	/// way. With three, dropping the first row onto the second must leave it
	/// second -- a handler reading SwiftUI's destination as a plain array
	/// index puts it last instead.
	func testDraggingASenseLandsItWhereItWasDropped() throws {
		let second = "a second meaning"
		let third = "a third meaning"

		CampusDictionaryScreen(app: app)
			.navigate()
			.search(for: TestIdentifiers.Dictionary.referenceEntry)
			.openWord(TestIdentifiers.Dictionary.referenceEntry)
			.verifyDefinitionSheetIsPresented()
			.openEditor()
			.verifyEditFormPushedIntoSheet()
			.addSense(withDefinition: second)
			.addSense(expectingRow: 3, withDefinition: third)
			.toggleReorderMode()
			.verifyReorderHandlesAppear(senseCount: 3)
			.dragSenseDownOneRow(from: 0)
			// Back out of reorder mode before reading: an active `editMode`
			// makes row content inert, and the rows are what carry the text.
			.toggleReorderMode()
			.verifyDefinitionOrder([
				second,
				TestIdentifiers.Dictionary.referenceEntryFirstDefinition,
				third,
			])
	}

	/// `usePreventRemove` should catch a sheet drag-down mid-edit the same way
	/// it catches the form's own Back button -- nothing in Jest exercises this
	/// gesture at all.
	func testDraggingTheSheetAwayMidEditIsRefused() throws {
		CampusDictionaryScreen(app: app)
			.navigate()
			.search(for: TestIdentifiers.Dictionary.referenceEntry)
			.openWord(TestIdentifiers.Dictionary.referenceEntry)
			.verifyDefinitionSheetIsPresented()
			.openEditor()
			.verifyEditFormPushedIntoSheet()
			.editFirstDefinition(prepending: "indeed ")
			.attemptToDragSheetClosed()
			.verifyDiscardChangesAlertPresented()
			.chooseToKeepEditing()
			.verifyEditFormPushedIntoSheet()
	}

	/// Rolvaag is the one entry carrying phonetics, so it is the only place
	/// this layout can be proven against real data rather than a fixture.
	func testAnEntryWithPhoneticsSetsThemBesideTheHeadword() throws {
		CampusDictionaryScreen(app: app)
			.navigate()
			.search(for: TestIdentifiers.Dictionary.phoneticEntryQuery)
			.openWord(TestIdentifiers.Dictionary.phoneticEntry)
			.verifyDefinitionSheetIsPresented()
			.verifyPronunciation(TestIdentifiers.Dictionary.phoneticEntryIPA)
			.verifyPartOfSpeech(TestIdentifiers.Dictionary.phoneticEntryPartOfSpeech)
			.capture("Dictionary entry with phonetics")
	}

	/// #7959: a multi-paragraph definition in a `{min, max}` line-limited row
	/// drew ten lines flush against the row's top edge, clipped at both ends,
	/// with three lines of dead row beneath it. Nothing in Jest can see this
	/// -- there is no layout pass there -- so the check is a screenshot of the
	/// field holding the definition that broke it.
	func testALongDefinitionFillsItsFieldWithoutClipping() throws {
		CampusDictionaryScreen(app: app)
			.navigate()
			.search(for: TestIdentifiers.Dictionary.longDefinitionEntry)
			.openWord(TestIdentifiers.Dictionary.longDefinitionEntry)
			.verifyDefinitionSheetIsPresented()
			.openEditor()
			.verifyEditFormPushedIntoSheet()
			.capture("Dictionary edit form for a long definition")
			.openSense(1)
			.capture("Dictionary sense screen for a long definition")
	}
}
