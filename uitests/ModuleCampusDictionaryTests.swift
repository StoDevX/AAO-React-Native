import XCTest

class ModuleCampusDictionaryTests: UITestCase {
	func testIsReachableFromHomescreen() throws {
		CampusDictionaryScreen(app: app)
			.navigate()
			.verifyCampusDictionaryTitle()
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
	func testPreviewIsRefusedUntilSomethingChanges() throws {
		CampusDictionaryScreen(app: app)
			.navigate()
			.search(for: TestIdentifiers.Dictionary.referenceEntry)
			.openWord(TestIdentifiers.Dictionary.referenceEntry)
			.verifyDefinitionSheetIsPresented()
			.openEditor()
			.verifyEditFormPushedIntoSheet()
			.verifyPreviewDisabled()
			.editFirstDefinition(appending: " indeed")
			.verifyPreviewEnabled()
	}

	/// The whole point of the flow: an edit previews as a marked-up diff, with
	/// every word `@expo/ui`'s `Text` would otherwise have silently dropped
	/// still on screen, and no DEBUG marker standing in for markup our patch
	/// should have supported.
	func testAnEditIsPreviewedAsAMarkedUpDiff() throws {
		CampusDictionaryScreen(app: app)
			.navigate()
			.search(for: TestIdentifiers.Dictionary.referenceEntry)
			.openWord(TestIdentifiers.Dictionary.referenceEntry)
			.verifyDefinitionSheetIsPresented()
			.openEditor()
			.verifyEditFormPushedIntoSheet()
			.editFirstDefinition(appending: " indeed")
			.verifyPreviewEnabled()
			.openPreview()
			.verifyPreviewPresented()
			.capture("Dictionary suggestion diff")
			.verifyNoUnsupportedNestedModifierMarker()
	}

	/// A second sense is what makes reordering meaningful -- the toggle should
	/// stay hidden for a single-sense entry and appear once there are two.
	func testASecondSenseOffersReordering() throws {
		CampusDictionaryScreen(app: app)
			.navigate()
			.search(for: TestIdentifiers.Dictionary.referenceEntry)
			.openWord(TestIdentifiers.Dictionary.referenceEntry)
			.verifyDefinitionSheetIsPresented()
			.openEditor()
			.verifyEditFormPushedIntoSheet()
			.addSense()
			.verifyReorderToggleVisible()
			.capture("Dictionary edit form with two senses")
			.toggleReorderMode()
			.verifyReorderHandlesAppear(senseCount: 2)
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
			.editFirstDefinition(appending: " indeed")
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

	/// Renders the reference entry so its screenshot can be measured against
	/// Apple's. Asserts only that the entry is up -- the comparison itself is
	/// done by eye and by pixel, not by an assertion.
	func testReferenceEntryForComparison() throws {
		CampusDictionaryScreen(app: app)
			.navigate()
			.search(for: TestIdentifiers.Dictionary.referenceEntry)
			.openWord(TestIdentifiers.Dictionary.referenceEntry)
			.verifyDefinitionSheetIsPresented()
			.capture("Reference entry")
	}
}
