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
	///
	/// `prepending` a short word ("new ") rather than a longer one: a longer
	/// string typed into this field lost characters, or lost keyboard focus
	/// outright partway through, while writing this suite -- `editFirstDefinition`'s
	/// own read-back assertion is what caught it. The likely cause is
	/// `SenseDefinitionField`'s cross-screen sync effect in `edit.tsx`, which
	/// resets this field's native handle to `sense.definition` whenever they
	/// disagree; its own comment assumes that never fires for a keystroke
	/// typed into this same row, but the store update `onTextChange` triggers
	/// is asynchronous, and a re-render landing mid-type can catch the native
	/// handle ahead of a `sense.definition` that has not caught up yet. A
	/// short burst is far less likely to straddle that window than a long
	/// one; it is a mitigation, not a fix, and the underlying race is still
	/// open.
	func testPreviewIsRefusedUntilSomethingChanges() throws {
		CampusDictionaryScreen(app: app)
			.navigate()
			.search(for: TestIdentifiers.Dictionary.referenceEntry)
			.openWord(TestIdentifiers.Dictionary.referenceEntry)
			.verifyDefinitionSheetIsPresented()
			.openEditor()
			.verifyEditFormPushedIntoSheet()
			.verifyPreviewDisabled()
			.editFirstDefinition(prepending: "new ")
			.verifyPreviewEnabled()
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
			.editFirstDefinition(prepending: "new ")
			.verifyPreviewEnabled()
			.openPreview()
			.verifyPreviewPresented()
			.capture("Dictionary suggestion diff")
			.verifyPreviewShows("something")
			.verifyPreviewShows("new")
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
			.editFirstDefinition(prepending: "new ")
			.attemptToDragSheetClosed()
			.verifyDiscardChangesAlertPresented()
			.chooseToKeepEditing()
			.verifyEditFormPushedIntoSheet()
	}

	/// A wholly added sense should sit on a green wash in the preview, beside
	/// the entry's original sense which -- untouched -- carries none, so one
	/// still image shows the wash marking a sense out rather than tinting
	/// everything equally.
	///
	/// `diffAdditionFill` and `diffDeletionFill` are `DynamicColorIOS` so that
	/// a tint pale enough for white does not glare on black, and that only
	/// holds if both appearances are looked at -- hence one test per
	/// appearance, each capturing under its own name. The appearance is set
	/// before the app is relaunched rather than mid-run: a dynamic colour
	/// resolves against the traits its view was drawn under, and relaunching
	/// draws the whole screen once, under the appearance being photographed.
	private func verifyAddedSenseWash(under appearance: XCUIDevice.Appearance, named: String) {
		let original = XCUIDevice.shared.appearance
		addTeardownBlock { XCUIDevice.shared.appearance = original }
		XCUIDevice.shared.appearance = appearance
		relaunchWithFreshState()

		let newSenseDefinition = "a wholly new meaning"
		CampusDictionaryScreen(app: app)
			.navigate()
			.search(for: TestIdentifiers.Dictionary.referenceEntry)
			.openWord(TestIdentifiers.Dictionary.referenceEntry)
			.verifyDefinitionSheetIsPresented()
			.openEditor()
			.verifyEditFormPushedIntoSheet()
			.addSense()
			.fillSecondDefinition(with: newSenseDefinition)
			.verifyPreviewEnabled()
			.openPreview()
			.verifyPreviewPresented()
			.capture(named)
			// The original sense, redrawn unchanged, and the added one beside
			// it -- the pairing the screenshot is meant to show.
			.verifyPreviewShows("someone")
			.verifyPreviewShows(newSenseDefinition)
			.verifyNoUnsupportedNestedModifierMarker()
	}

	func testANewSenseShowsAGreenWashInThePreviewLight() throws {
		verifyAddedSenseWash(under: .light, named: "Dictionary diff with an added sense (light)")
	}

	func testANewSenseShowsAGreenWashInThePreviewDark() throws {
		verifyAddedSenseWash(under: .dark, named: "Dictionary diff with an added sense (dark)")
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
