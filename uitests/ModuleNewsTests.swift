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

	func testComicOpensTheZoomViewer() throws {
		let news = NewsScreen(app: app, tile: TestIdentifiers.Buttons.olafMessenger, title: "The Olaf Messenger")
			.navigate()
		MessFilter(app: app)
			.choose(column: TestIdentifiers.News.comicColumn, in: TestIdentifiers.News.varietySection)
		news.openFirstStory()
			.openImageViewer()
			.closeImageViewer()
	}
}
