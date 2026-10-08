import XCTest

/// Routes: /dictionary
class ModuleCampusDictionaryTests: UITestCaseUnbooted {
	/// A search made from far down the list starts its results at the top.
	/// The first word then opens a half-height sheet whose lone sense lines up
	/// with the headword, and the sheet closes again.
	func testSearchingFromFarDownOpensTheFirstWordInAHalfHeightSheet() throws {
		CampusDictionaryScreen(app: app)
			.navigate()
			.verifySectionIndexRailScrolls()
			.search(for: TestIdentifiers.Dictionary.firstEntrySearchTerm)
			.verifyFirstEntryIsOnScreen()
			.openFirstWord()
			.verifyDefinitionSheetIsPresented()
			.verifySheetIsHalfHeight()
			.verifySenseAlignsWithHeadword(
				TestIdentifiers.Dictionary.firstEntry,
				definition: TestIdentifiers.Dictionary.firstEntryDefinition)
			.dismissEntrySheet()
			.verifyEntrySheetIsGone()
	}

	/// An edit previews as a marked-up diff, with every word `@expo/ui`'s `Text` would otherwise have
	/// silently dropped still on screen, and no DEBUG marker standing in for
	/// markup our patch should have supported. `verifyPreviewShows` is the
	/// actual proof of that -- `verifyPreviewPresented` alone would pass
	/// against a completely blank preview, since its identifier sits on the
	/// outer container.
	///
	/// `addedWord` and the space after it make seven characters, here and in every other test
	/// that types into this field: a shorter burst does not reliably straddle
	/// the window in which a keystroke sent to a native text field can be
	/// dropped between renders. Seven characters is what it takes to trip that
	/// race reliably -- `editFirstDefinition`'s read-back of the field's value
	/// is what fails if one ever is.
	///
	/// Suggest an Edit pushes the edit form into the entry sheet's own stack,
	/// rather than presenting some other way -- its own Back button is what
	/// `verifyEditFormPushedIntoSheet` looks for.
	///
	/// `usePreventRemove` should catch a sheet drag-down mid-edit the same way
	/// it catches the form's own Back button -- nothing in Jest exercises this
	/// gesture at all -- so the sheet is dragged once the edit has landed.
	func testAnEditPreviewsAsAMarkedUpDiffOnceSomethingChanges() throws {
		CampusDictionaryScreen(app: app)
			.navigate()
			.search(for: TestIdentifiers.Dictionary.referenceEntry)
			.openWord(TestIdentifiers.Dictionary.referenceEntry)
			.verifyDefinitionSheetIsPresented()
			.openEditor()
			.verifyEditFormPushedIntoSheet()
			.editFirstDefinition(prepending: TestIdentifiers.Dictionary.addedWord + " ")
			.attemptToDragSheetClosed()
			.verifyDiscardChangesAlertPresented()
			.chooseToKeepEditing()
			.verifyEditFormPushedIntoSheet()
			.openPreview()
			.verifyPreviewPresented()
			.verifyPreviewShows(TestIdentifiers.Dictionary.aWordOfTheDefinition)
			.verifyPreviewShows(TestIdentifiers.Dictionary.addedWord)
			.verifyNoUnsupportedNestedModifierMarker()
	}
}
