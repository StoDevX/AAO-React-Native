import XCTest

class ModuleNewsTests: UITestCaseUnbooted {
	/// The paper opens By Issue on its grid of issues, and a real scroll down the grid pages
	/// back through older issues.
	func testOlafMessengerOpensOnTheIssueGridAndLoadsOlderPages() throws {
		MessFrontPage(app: app)
			.navigate()
			.verifyByIssueShowsTheGrid()
			.scrollIssues(untilAnIssueFrom: "2025")
	}

	func testOlafMessengerMenuOpensAStaffMember() throws {
		MessFrontPage(app: app)
			.navigate()
			.openFirstStaffMember()
	}

	/// The paintbrush opens the paper's Customize sheet, whose pickers take a choice. With Dark
	/// page for Photo stories turned off there, a Photo story follows the system's appearance.
	func testOlafMessengerCustomizeTurnsOffDarkPhotoStories() throws {
		let front = MessFrontPage(app: app).navigate()
		let customize = front.openCustomize()
		customize
			.chooseStain("Tea")
			.keepPhotoStoriesDark(false)
			.close()
		let story = front
			.openColumn(TestIdentifiers.News.photoColumn, in: TestIdentifiers.News.varietySection)
			.openFirstStory()
			.verifyHeadlineAppears()
		story.verifyPage(dark: false, "with the setting off, a Photo story should stay light")
	}

	/// A shelf's "All ›" lists the section's stories from its issue, and Back keeps the issue's
	/// place. Under UI tests the second issue is the May 12 special edition, whose stories all
	/// sit in no print section, so its More grid sets them two to a row.
	func testOlafMessengerIssuesListTheirSectionsAndGridTheRest() throws {
		let front = MessFrontPage(app: app).navigate()
		front
			.openNewestIssue()
			.scrollDownALittle()
			.openSectionHoldingTheLead(TestIdentifiers.News.newsSection)
			.goBack()
		front.openSecondIssue()
		MessIssueScreen(app: app)
			.verifyMoreGridsItsStories()
	}

	/// An article's lead photo opens the zoom viewer. A reader can drag a selection from one
	/// paragraph into the next, as each stretch of prose between figures is one text view, and
	/// a figure further down the body opens the viewer too, which can share the figure.
	///
	/// In that order because the page is only ever scrolled down: the lead photo sits above
	/// the body, and the figure below the paragraphs selected.
	func testArticlePhotosOpenTheZoomViewerAndItsTextSelectsAcrossParagraphs() throws {
		MessStoryScreen(app: app)
			.navigate(to: TestIdentifiers.News.illustratedStoryRoute)
			.openPhotoInViewer(
				captioned: NSPredicate(format: "label ENDSWITH %@", TestIdentifiers.News.illustratedLeadCaptionEnd),
				"the lead photo")
			.verifyViewerShowsImage()
			.closeImageViewer()
			.verifySelectionCrossesParagraphs()
			.openPhotoInViewer(
				captioned: NSPredicate(format: "label BEGINSWITH %@", TestIdentifiers.News.illustratedFigureCaptionStart),
				"a figure in the body")
			.verifyViewerShowsImage()
			.shareViewerImage()
			.closeImageViewer()
	}

	/// A link in a story's text opens in the in-app browser when tapped, and offers the
	/// system's link menu when held.
	func testOlafMessengerStoryLinkOffersLinkMenu() throws {
		MessStoryScreen(app: app)
			.navigate(to: TestIdentifiers.News.linkedStoryRoute)
			.openLinkInAppBrowser(TestIdentifiers.News.linkedStoryLink)
			.verifyLinkOffersLinkMenu(TestIdentifiers.News.linkedStoryLink)
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

	/// The zoom viewer's gestures on a comic. A double tap zooms in, and a drag on the zoomed
	/// picture pans it rather than closing the viewer; another double tap fits it back, and a
	/// pinch zooms in again. At fit, a short drag let go slowly springs back, and a long one
	/// closes the viewer.
	func testComicViewerZoomsPansAndClosesByDragging() throws {
		MessFrontPage(app: app)
			.navigate()
			.openColumn(TestIdentifiers.News.comicColumn, in: TestIdentifiers.News.varietySection)
			.openFirstStory()
			.openImageViewer()
			.doubleTapViewerImage()
			.verifyViewerImageZoomed(true)
			.dragViewerImage(.long)
			.verifyViewerOpen(true, "a drag on a zoomed picture should pan it, not close the viewer")
			.verifyViewerImageZoomed(true)
			.doubleTapViewerImage()
			.verifyViewerImageZoomed(false)
			.pinchOutViewerImage()
			.verifyViewerImageZoomed(true)
			.doubleTapViewerImage()
			.verifyViewerImageZoomed(false)
			.dragViewerImage(.short)
			.verifyViewerOpen(true, "a short drag let go slowly should spring the picture back")
			.dragViewerImage(.long)
			.verifyViewerOpen(false, "a long drag down should close the zoom viewer")
	}

	/// A crossword's own page, reached by a link to the post, still offers its puzzle.
	func testCrosswordPageOpensThePuzzleInTheBrowser() throws {
		MessStoryScreen(app: app)
			.navigate(to: TestIdentifiers.News.crosswordStoryRoute)
			.solveCrossword()
	}

	func testRecipeTicksAnIngredient() throws {
		MessFrontPage(app: app)
			.navigate()
			.openColumn(TestIdentifiers.News.recipesColumn, in: TestIdentifiers.News.varietySection)
			.openFirstStory()
			.tickFirstIngredient()
	}

	/// A Photo story opens dark while the setting is on, and its picture opens the zoom viewer.
	/// The page it was opened from is light again after Back. The suite runs in Light Mode.
	func testPhotoStoriesOpenInDarkModeAndZoom() throws {
		let front = MessFrontPage(app: app)
			.navigate()
			.openColumn(TestIdentifiers.News.photoColumn, in: TestIdentifiers.News.varietySection)
		let story = front.openFirstStory().verifyHeadlineAppears()
		story.verifyPage(dark: true, "a Photo story should open in Dark Mode")
		// An error screen is dark too, so the story must still be the page on show.
		story.verifyHeadlineAppears()
		story
			.openImageViewer()
			.verifyViewerShowsImage()
			.closeImageViewer()

		story.goBack()
		XCTAssertTrue(
			front.storyRows.firstMatch.waitForExistence(timeout: 10), "Back should return to the Photo list")
		story.verifyPage(dark: false, "the Photo list should be light again after Back")
	}
}
