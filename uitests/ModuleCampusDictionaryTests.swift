import XCTest

class ModuleCampusDictionaryTests: UITestCase {
	func testSearchingFromFarDownTheListShowsTheFirstResult() throws {
		try CampusDictionaryScreen(app: app)
			.navigate()
			.verifySectionIndexRailScrolls()
			.search(for: TestIdentifiers.Dictionary.firstEntrySearchTerm)
			.verifyFirstEntryIsOnScreen()
	}

	/// A word opens a half-height sheet whose lone sense lines up with the
	/// headword, and the sheet closes again.
	func testAWordOpensAHalfHeightSheetThatCloses() throws {
		CampusDictionaryScreen(app: app)
			.navigate()
			.openFirstWord()
			.verifyDefinitionSheetIsPresented()
			.capture("Dictionary definition sheet")
			.verifySheetIsHalfHeight()
			.verifySenseAlignsWithHeadword(
				TestIdentifiers.Dictionary.firstEntry,
				definition: TestIdentifiers.Dictionary.firstEntryDefinition)
			.dismissEntrySheet()
			.verifyEntrySheetIsGone()
	}

	/// Preview should refuse to open until the draft actually differs from
	/// the entry as opened -- retyping nothing is not a suggestion.
	///
	/// Once it opens, it is the whole point of the flow: an edit previews as a
	/// marked-up diff, with every word `@expo/ui`'s `Text` would otherwise have
	/// silently dropped still on screen, and no DEBUG marker standing in for
	/// markup our patch should have supported. `verifyPreviewShows` is the
	/// actual proof of that -- `verifyPreviewPresented` alone would pass
	/// against a completely blank preview, since its identifier sits on the
	/// outer container.
	///
	/// `"indeed "` rather than a shorter word, here and in every other test
	/// that types into this field: a shorter burst does not reliably straddle
	/// the window in which a keystroke sent to a native text field can be
	/// dropped between renders. Seven characters is what it takes to trip that
	/// race reliably -- `editFirstDefinition`'s read-back of the field's value
	/// is what fails if one ever is.
	///
	/// Suggest an Edit pushes the edit form into the entry sheet's own stack,
	/// rather than presenting some other way -- its own Back button is what
	/// `verifyEditFormPushedIntoSheet` looks for.
	func testAnEditPreviewsAsAMarkedUpDiffOnceSomethingChanges() throws {
		CampusDictionaryScreen(app: app)
			.navigate()
			.search(for: TestIdentifiers.Dictionary.referenceEntry)
			.openWord(TestIdentifiers.Dictionary.referenceEntry)
			.verifyDefinitionSheetIsPresented()
			.openEditor()
			.verifyEditFormPushedIntoSheet()
			.capture("Dictionary edit form")
			.verifyPreviewDisabled()
			.editFirstDefinition(prepending: "indeed ")
			.verifyPreviewEnabled()
			// The form once an edit has landed. Its footer is the one place the
			// second wording is drawn, and it sits under the keyboard until the
			// form is scrolled -- so revealing it is what makes the capture show
			// the state this test just put the draft into.
			.revealInForm("Ready to preview")
			.capture("Dictionary edit form with a change made")
			.openPreview()
			.verifyPreviewPresented()
			.capture("Dictionary suggestion diff")
			.verifyPreviewShows("something")
			.verifyPreviewShows("indeed")
			.verifyNoUnsupportedNestedModifierMarker()
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
}
