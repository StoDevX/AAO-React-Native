import XCTest

class ModuleNewsTests: UITestCaseUnbooted {
	func testOlafMessengerOpensOnTheIssueGrid() throws {
		MessFrontPage(app: app)
			.navigate()
			.verifyByIssueShowsTheGrid()
	}

	func testOlafMessengerLatestNarrowsToASection() throws {
		MessFrontPage(app: app)
			.navigate()
			.filterLatest(to: TestIdentifiers.News.newsSection)
	}

	func testOlafMessengerOpensAnOlderIssue() throws {
		MessFrontPage(app: app)
			.navigate()
			.openSecondIssue()
	}

	func testOlafMessengerIssuesLoadOlderPages() throws {
		MessFrontPage(app: app)
			.navigate()
			.scrollIssues(untilAnIssueFrom: "2025")
	}

	func testOlafMessengerSectionOpensAColumn() throws {
		MessFrontPage(app: app)
			.navigate()
			.openColumn(TestIdentifiers.News.goodQuestionsColumn, in: TestIdentifiers.News.newsSection)
	}

	func testOlafMessengerStoryTextOffersCopy() throws {
		MessFrontPage(app: app)
			.navigate()
			.openLeadStory()
			.verifyStoryAppears()
			.verifyBodyOffersCopy()
	}

	/// A sign picked from the list scrolls the page up to it; one picked from the glyph grid,
	/// which is already in view, leaves the page where it is. The post is reopened before the
	/// grid is tapped, so the grid sits below the intro rather than at the top of the screen.
	func testHoroscopesOpenOnAChosenSign() throws {
		let front = MessFrontPage(app: app)
		front
			.navigate()
			.openColumn(TestIdentifiers.News.horoscopesColumn, in: TestIdentifiers.News.varietySection)
			.openFirstStory()
			.pickSignFromList(TestIdentifiers.News.gemini)
			.verifySignChosen(TestIdentifiers.News.gemini)
			.verifyScrolledToChosenSign(TestIdentifiers.News.gemini)
			.goBack()
		front
			.openFirstStory()
			.verifySignChosen(TestIdentifiers.News.gemini)
			.tapSignGlyphKeepingThePlace(TestIdentifiers.News.leo)
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
		keepStateForNextLaunch(
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

	/// Each story opened from a series row is a screen of its own, even one already
	/// open further down, so Back retraces every step in the order it was taken.
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

	func testCrosswordOpensThePuzzleInTheBrowser() throws {
		MessFrontPage(app: app)
			.navigate()
			.openColumn(TestIdentifiers.News.crosswordColumn, in: TestIdentifiers.News.varietySection)
			.openFirstStory()
			.solveCrossword()
	}

	func testRecipeTicksAnIngredient() throws {
		MessFrontPage(app: app)
			.navigate()
			.openColumn(TestIdentifiers.News.recipesColumn, in: TestIdentifiers.News.varietySection)
			.openFirstStory()
			.tickFirstIngredient()
	}

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
