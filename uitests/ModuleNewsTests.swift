import XCTest

class ModuleNewsTests: UITestCase {
	func testOlafMessengerIsReachableFromHomescreen() throws {
		NewsScreen(app: app, tile: TestIdentifiers.Buttons.olafMessenger, title: "The Olaf Messenger")
			.navigate()
			.verifyTitle()
			.verifyNewsRowsAppear()
	}

	func testStOlafNewsIsReachableFromHomescreen() throws {
		NewsScreen(app: app, tile: TestIdentifiers.Buttons.stOlafNews, title: "St. Olaf News")
			.navigate()
			.verifyTitle()
			.verifyNewsRowsAppear()
	}

	func testOlafMessengerOpensAStoryInTheApp() throws {
		NewsScreen(app: app, tile: TestIdentifiers.Buttons.olafMessenger, title: "The Olaf Messenger")
			.navigate()
			.openFirstStory()
			.verifyStoryAppears()
	}

	func testOlafMessengerStoryTextOffersCopy() throws {
		NewsScreen(app: app, tile: TestIdentifiers.Buttons.olafMessenger, title: "The Olaf Messenger")
			.navigate()
			.openFirstStory()
			.verifyStoryAppears()
			.verifyBodyOffersCopy()
	}

	func testHoroscopesOpenOnAChosenSign() throws {
		let news = NewsScreen(app: app, tile: TestIdentifiers.Buttons.olafMessenger, title: "The Olaf Messenger")
			.navigate()
		MessFilter(app: app)
			.choose(column: TestIdentifiers.News.horoscopesColumn, in: TestIdentifiers.News.varietySection)
		news.openFirstStory()
			.pickSignFromList(TestIdentifiers.News.gemini)
			.verifySignChosen(TestIdentifiers.News.gemini)
			.verifyScrolledToChosenSign(TestIdentifiers.News.gemini)
			.tapSignGlyph(TestIdentifiers.News.leo)
			.verifySignChosen(TestIdentifiers.News.leo)
			.verifyScrolledToChosenSign(TestIdentifiers.News.leo)
	}

	/// At the largest text size the chosen sign's section sits a long way above
	/// the last rows, so the page has to scroll to a section it has not yet drawn.
	func testHoroscopesScrollToASignPickedFromTheLastRow() throws {
		relaunch(atContentSizeCategory: TestIdentifiers.LaunchArguments.accessibilityExtraExtraExtraLarge)
		let news = NewsScreen(app: app, tile: TestIdentifiers.Buttons.olafMessenger, title: "The Olaf Messenger")
			.navigate()
		MessFilter(app: app)
			.choose(column: TestIdentifiers.News.horoscopesColumn, in: TestIdentifiers.News.varietySection)
		news.openFirstStory()
			.scrollToSignRow(TestIdentifiers.News.pisces)
			.pickSignFromList(TestIdentifiers.News.pisces)
			.verifySignChosen(TestIdentifiers.News.pisces)
			.verifyScrolledToChosenSign(TestIdentifiers.News.pisces)
			.scrollToSignRow(TestIdentifiers.News.aquarius)
			.pickSignFromList(TestIdentifiers.News.aquarius)
			.verifySignChosen(TestIdentifiers.News.aquarius)
			.verifyScrolledToChosenSign(TestIdentifiers.News.aquarius)
	}

	func testComicOpensTheZoomViewer() throws {
		let news = NewsScreen(app: app, tile: TestIdentifiers.Buttons.olafMessenger, title: "The Olaf Messenger")
			.navigate()
		MessFilter(app: app)
			.choose(column: TestIdentifiers.News.comicColumn, in: TestIdentifiers.News.varietySection)
		news.openFirstStory()
			.openImageViewer()
			.closeImageViewer()
	}

	func testComicZoomsByDoubleTapAndPinch() throws {
		let news = NewsScreen(app: app, tile: TestIdentifiers.Buttons.olafMessenger, title: "The Olaf Messenger")
			.navigate()
		MessFilter(app: app)
			.choose(column: TestIdentifiers.News.comicColumn, in: TestIdentifiers.News.varietySection)
		news.openFirstStory()
			.openImageViewer()
			.doubleTapViewerImage()
			.verifyViewerImageZoomed(true)
			.doubleTapViewerImage()
			.verifyViewerImageZoomed(false)
			.pinchOutViewerImage()
			.verifyViewerImageZoomed(true)
			.closeImageViewer()
	}
}
