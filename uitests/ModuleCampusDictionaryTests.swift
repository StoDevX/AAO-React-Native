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

	func testTheEditorOpensOverTheDefinition() throws {
		CampusDictionaryScreen(app: app)
			.navigate()
			.openFirstWord()
			.verifyDefinitionSheetIsPresented()
			.openEditor()
			.verifyEditorIsPresented()
			.capture("Dictionary editor sheet")
			.focusWordField()
			.capture("Dictionary editor sheet with keyboard")
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
