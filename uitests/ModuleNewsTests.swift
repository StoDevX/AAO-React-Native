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
	///
	/// The column is chosen at the default size and the app relaunched at AX5
	/// keeping it. At AX5 on a small phone the filter menu can scroll away from
	/// an item once it is ticked, taking it out of the accessibility tree, so the
	/// filter could not confirm the choice it had just made -- and the menu is not
	/// what this test is about.
	func testHoroscopesScrollToASignPickedFromTheLastRow() throws {
		let tile = TestIdentifiers.Buttons.olafMessenger
		NewsScreen(app: app, tile: tile, title: "The Olaf Messenger")
			.navigate()
		MessFilter(app: app)
			.choose(column: TestIdentifiers.News.horoscopesColumn, in: TestIdentifiers.News.varietySection)
		relaunchKeepingState(
			adding: TestIdentifiers.LaunchArguments.contentSizeCategory(
				TestIdentifiers.LaunchArguments.accessibilityExtraExtraExtraLarge))
		NewsScreen(app: app, tile: tile, title: "The Olaf Messenger")
			.navigate()
			.openFirstStory()
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

	/// Each story opened from a series row is a screen of its own, even one already
	/// open further down, so Back retraces every step in the order it was taken.
	///
	/// This reads live data: the first Comic's series row has to list a story whose
	/// own series row lists that first Comic back. A Comic without a series, or one
	/// whose series has moved on, fails the test without anything being wrong.
	func testSeriesStoriesStackInTheOrderTheyWereOpened() throws {
		let news = NewsScreen(app: app, tile: TestIdentifiers.Buttons.olafMessenger, title: "The Olaf Messenger")
			.navigate()
		MessFilter(app: app)
			.choose(column: TestIdentifiers.News.comicColumn, in: TestIdentifiers.News.varietySection)
		let reader = news.openFirstStory()
		let first = reader.headline()
		reader.openSeriesStory()
		let second = reader.headline(otherThan: first)
		reader.openSeriesStory(titled: first)
			.verifyHeadline(first, "a series row should open the story it names")
			.goBack()
			.verifyHeadline(second, "Back should return to the story whose row was tapped")
			.goBack()
			.verifyHeadline(first, "Back again should return to the story opened first")
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

	/// Reads live data: the newest Crossword post has to carry PuzzleMe's placeholder.
	func testCrosswordOpensThePuzzleInTheBrowser() throws {
		let news = NewsScreen(app: app, tile: TestIdentifiers.Buttons.olafMessenger, title: "The Olaf Messenger")
			.navigate()
		MessFilter(app: app)
			.choose(column: TestIdentifiers.News.crosswordColumn, in: TestIdentifiers.News.varietySection)
		news.openFirstStory()
			.solveCrossword()
	}

	/// Reads live data: the newest Playlist post has to name its playlist, in its body or on
	/// its web page.
	func testPlaylistDrawsSpotifysPlayer() throws {
		let news = NewsScreen(app: app, tile: TestIdentifiers.Buttons.olafMessenger, title: "The Olaf Messenger")
			.navigate()
		MessFilter(app: app)
			.choose(column: TestIdentifiers.News.playlistColumn, in: TestIdentifiers.News.varietySection)
		news.openFirstStory()
			.verifyPlaylistOffered()
	}
}
