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
			.closeDefinitionSheet()
			.verifyDefinitionSheetIsGone()
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

	/// `@expo/ui`'s `ios/BottomSheetView.swift` only fires `onIsPresentedChange`
	/// when the native side changes `isPresented` out from under the JS prop --
	/// a JS-initiated close (the X button) sets the same value the prop already
	/// holds, so its own `isPresented == newIsPresented` guard swallows the
	/// callback. `app/(home)/Dictionary/index.tsx` routes both the X button and
	/// the native drag-to-dismiss gesture through one `dismissSheet`, which
	/// resets the detent along with the selection -- but nothing except a
	/// running app can prove the X path still does that reset. This drags the
	/// sheet to `large`, closes with the X rather than a drag, and opens a
	/// different entry: if the reset were ever skipped again, that sheet would
	/// reopen at `large` instead of `medium`.
	func testClosingWithXResetsTheDetentForTheNextEntry() throws {
		CampusDictionaryScreen(app: app)
			.navigate()
			.openFirstWord()
			.verifyDefinitionSheetIsPresented()
			.dragSheetToLargeDetent()
			.verifySheetIsLargeHeight()
			.closeDefinitionSheet()
			.verifyDefinitionSheetIsGone()
			.openSecondWord()
			.verifyDefinitionSheetIsPresented()
			.verifySheetIsHalfHeight()
	}
}
