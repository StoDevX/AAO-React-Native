import XCTest

class ModuleNewsTests: UITestCase {
	/// Reads live data: the paper has to have published at least two issues.
	func testOlafMessengerOpensOnTheIssueGrid() throws {
		MessFrontPage(app: app)
			.navigate()
			.verifyByIssueShowsTheGrid()
	}

	func testOlafMessengerLatestListsStoriesWithAFilter() throws {
		MessFrontPage(app: app)
			.navigate()
			.verifyLatestListsStoriesWithSections()
	}

	/// Reads live data: the paper has to have a News section.
	func testOlafMessengerLatestNarrowsToASection() throws {
		MessFrontPage(app: app)
			.navigate()
			.filterLatest(to: TestIdentifiers.News.newsSection)
	}

	func testStOlafNewsIsReachableFromHomescreen() throws {
		NewsScreen(app: app, tile: TestIdentifiers.Buttons.stOlafNews, title: "St. Olaf News")
			.navigate()
			.verifyTitle()
			.verifyNewsRowsAppear()
	}

	/// Reads live data: the paper has to have published at least two issues.
	func testOlafMessengerOpensAnOlderIssue() throws {
		MessFrontPage(app: app)
			.navigate()
			.openSecondIssue()
	}

	/// Reads live data: the paper has to have published issues in 2025, three pages back.
	func testOlafMessengerIssuesLoadOlderPages() throws {
		MessFrontPage(app: app)
			.navigate()
			.scrollIssues(untilAnIssueFrom: "2025")
	}

	/// Reads live data: News has to have its Good Questions column, with a story in it.
	func testOlafMessengerSectionOpensAColumn() throws {
		MessFrontPage(app: app)
			.navigate()
			.openColumn(TestIdentifiers.News.goodQuestionsColumn, in: TestIdentifiers.News.newsSection)
	}

	func testOlafMessengerOpensAStoryInTheApp() throws {
		MessFrontPage(app: app)
			.navigate()
			.openLeadStory()
			.verifyStoryAppears()
	}

	func testOlafMessengerStoryTextOffersCopy() throws {
		MessFrontPage(app: app)
			.navigate()
			.openLeadStory()
			.verifyStoryAppears()
			.verifyBodyOffersCopy()
	}

	func testHoroscopesOpenOnAChosenSign() throws {
		MessFrontPage(app: app)
			.navigate()
			.openColumn(TestIdentifiers.News.horoscopesColumn, in: TestIdentifiers.News.varietySection)
			.openFirstStory()
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
	/// The app is relaunched at AX5 before the column is opened.
	func testHoroscopesScrollToASignPickedFromTheLastRow() throws {
		// Latest is narrowed to Variety at the usual text size and kept across the relaunch: at the
		// largest size the section menu scrolls to its chosen row as it opens, and XCUITest reads the
		// rows' frames from before that scroll, so a tap there lands on the wrong section.
		MessFrontPage(app: app)
			.navigate()
			.filterLatest(to: TestIdentifiers.News.varietySection)
		relaunchKeepingState(
			adding: TestIdentifiers.LaunchArguments.contentSizeCategory(
				TestIdentifiers.LaunchArguments.accessibilityExtraExtraExtraLarge))
		MessFrontPage(app: app)
			.navigate()
			.openColumn(TestIdentifiers.News.horoscopesColumn, inShown: TestIdentifiers.News.varietySection)
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
		MessFrontPage(app: app)
			.navigate()
			.openColumn(TestIdentifiers.News.comicColumn, in: TestIdentifiers.News.varietySection)
			.openFirstStory()
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
		let reader = MessFrontPage(app: app)
			.navigate()
			.openColumn(TestIdentifiers.News.comicColumn, in: TestIdentifiers.News.varietySection)
			.openFirstStory()
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
		MessFrontPage(app: app)
			.navigate()
			.openColumn(TestIdentifiers.News.comicColumn, in: TestIdentifiers.News.varietySection)
			.openFirstStory()
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
		MessFrontPage(app: app)
			.navigate()
			.openColumn(TestIdentifiers.News.crosswordColumn, in: TestIdentifiers.News.varietySection)
			.openFirstStory()
			.solveCrossword()
	}

	/// Reads live data: the newest Playlist post has to name its playlist, in its body or on
	/// its web page.
	func testPlaylistDrawsSpotifysPlayer() throws {
		MessFrontPage(app: app)
			.navigate()
			.openColumn(TestIdentifiers.News.playlistColumn, in: TestIdentifiers.News.varietySection)
			.openFirstStory()
			.verifyPlaylistOffered()
	}

	/// Reads live data: the newest Recipes post has to have an ingredient section.
	func testRecipeTicksAnIngredient() throws {
		MessFrontPage(app: app)
			.navigate()
			.openColumn(TestIdentifiers.News.recipesColumn, in: TestIdentifiers.News.varietySection)
			.openFirstStory()
			.tickFirstIngredient()
	}

	/// Reads live data: the newest Photo post has to have a picture.
	func testPhotoOpensTheZoomViewer() throws {
		MessFrontPage(app: app)
			.navigate()
			.openColumn(TestIdentifiers.News.photoColumn, in: TestIdentifiers.News.varietySection)
			.openFirstStory()
			.openImageViewer()
			.verifyViewerShowsImage()
			.closeImageViewer()
	}
}
