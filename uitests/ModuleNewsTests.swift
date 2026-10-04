import XCTest

class ModuleNewsTests: UITestCaseUnbooted {
	func testOlafMessengerOpensOnTheIssueGrid() throws {
		MessFrontPage(app: app)
			.navigate()
			.verifyByIssueShowsTheGrid()
	}

	func testOlafMessengerPaintbrushChangesTheIssueStain() throws {
		let customize = MessFrontPage(app: app).navigate().openCustomize()
		customize.capture("Messenger Customize, before")
		customize.chooseStain("Tea")
		customize.capture("Messenger Customize, Tea chosen").close()
	}

	/// Captures the issue grid under each photo tone, to compare them by eye.
	func testOlafMessengerPhotoTonesTintTheThumbnails() throws {
		let front = MessFrontPage(app: app).navigate().verifyByIssueShowsTheGrid()
		for tone in ["Automatic", "Color", "Sepia"] {
			front.openCustomize().choosePhotoTone(tone).close()
			front.captureGrid("Issue thumbnails, \(tone)")
		}
	}

	func testOlafMessengerLatestNarrowsToASection() throws {
		MessFrontPage(app: app)
			.navigate()
			.filterLatest(to: TestIdentifiers.News.newsSection)
	}

	func testOlafMessengerMenuOpensAStaffMember() throws {
		MessFrontPage(app: app)
			.navigate()
			.openFirstStaffMember()
	}

	func testOlafMessengerOpensAnOlderIssue() throws {
		MessFrontPage(app: app)
			.navigate()
			.openSecondIssue()
	}

	func testOlafMessengerShelfAllListsTheSectionFromItsIssue() throws {
		MessFrontPage(app: app)
			.navigate()
			.openNewestIssue()
			.scrollDownALittle()
			.openSectionHoldingTheLead(TestIdentifiers.News.newsSection)
	}

	func testOlafMessengerSpecialEditionGridsItsStories() throws {
		MessFrontPage(app: app)
			.navigate()
			// Under UI tests the second issue is the May 12 special edition, whose stories all sit
			// in no print section.
			.openSecondIssue()
		MessIssueScreen(app: app)
			.verifyMoreGridsItsStories()
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

	/// A reader can drag a selection from one paragraph into the next, as each stretch of
	/// prose between figures is one text view.
	func testOlafMessengerSelectionCrossesParagraphs() throws {
		MessStoryScreen(app: app)
			.navigate(to: TestIdentifiers.News.illustratedStoryRoute)
			.verifySelectionCrossesParagraphs()
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

	/// A Photo story opens dark while the setting is on, and the page it was opened from is light
	/// again after Back. The suite runs in Light Mode.
	func testPhotoStoriesOpenInDarkMode() throws {
		let front = MessFrontPage(app: app)
			.navigate()
			.openColumn(TestIdentifiers.News.photoColumn, in: TestIdentifiers.News.varietySection)
		let story = front.openFirstStory().verifyHeadlineAppears()
		story.verifyPage(dark: true, "a Photo story should open in Dark Mode")
		// An error screen is dark too, so the story must still be the page on show.
		story.verifyHeadlineAppears()
		story.capture("Photo story, kept dark")

		story.goBack()
		XCTAssertTrue(
			front.storyRows.firstMatch.waitForExistence(timeout: 10), "Back should return to the Photo list")
		story.verifyPage(dark: false, "the Photo list should be light again after Back")
		front.capture("Photo list after Back")
	}

	/// With the setting off, a Photo story follows the system's appearance.
	func testPhotoStoriesFollowTheSystemWhenTheSettingIsOff() throws {
		let front = MessFrontPage(app: app).navigate()
		front.openCustomize().keepPhotoStoriesDark(false).close()
		let story = front
			.openColumn(TestIdentifiers.News.photoColumn, in: TestIdentifiers.News.varietySection)
			.openFirstStory()
			.verifyHeadlineAppears()
		story.verifyPage(dark: false, "with the setting off, a Photo story should stay light")
		story.capture("Photo story, setting off")
	}

	func testPhotoOpensTheZoomViewer() throws {
		MessFrontPage(app: app)
			.navigate()
			.openColumn(TestIdentifiers.News.photoColumn, in: TestIdentifiers.News.varietySection)
			.openFirstStory()
			.openImageViewer()
			.verifyViewerShowsImage()
			.shareViewerImage()
			.closeImageViewer()
	}

	/// An article's lead photo and a figure in its body each open the zoom viewer, which can
	/// share the figure.
	func testArticlePhotosOpenTheZoomViewer() throws {
		MessStoryScreen(app: app)
			.navigate(to: TestIdentifiers.News.illustratedStoryRoute)
			.openPhotoInViewer(
				captioned: NSPredicate(format: "label ENDSWITH %@", TestIdentifiers.News.illustratedLeadCaptionEnd),
				"the lead photo")
			.verifyViewerShowsImage()
			.closeImageViewer()
			.openPhotoInViewer(
				captioned: NSPredicate(format: "label BEGINSWITH %@", TestIdentifiers.News.illustratedFigureCaptionStart),
				"a figure in the body")
			.verifyViewerShowsImage()
			.shareViewerImage()
			.closeImageViewer()
	}

	func testDraggingThePictureDownClosesTheZoomViewer() throws {
		MessFrontPage(app: app)
			.navigate()
			.openColumn(TestIdentifiers.News.comicColumn, in: TestIdentifiers.News.varietySection)
			.openFirstStory()
			.openImageViewer()
			.dragViewerImage(.short)
			.verifyViewerOpen(true, "a short drag let go slowly should spring the picture back")
			.dragViewerImage(.long)
			.verifyViewerOpen(false, "a long drag down should close the zoom viewer")
	}

	func testDraggingAZoomedPictureDoesNotCloseTheZoomViewer() throws {
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
			.closeImageViewer()
	}
}
