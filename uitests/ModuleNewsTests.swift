import XCTest

/// Tags: campus:example.college
class ModuleNewsTests: UITestCaseUnbooted {
	override class var campus: Campus? { .example }

	/// The paper opens By Issue on its grid of issues, and a real scroll down the grid pages
	/// back through older issues.
	func testThePaperOpensOnTheIssueGridAndLoadsOlderPages() throws {
		MessFrontPage(app: app)
			.navigate()
			.scrollIssues(untilAnIssueFrom: "2025")
	}

	/// A shelf's "All ›" opens the section's stories from its issue, and Back keeps the issue's
	/// place. The Valley Echo's second issue is its May 5 special edition, whose stories all
	/// sit in no print section, so its More grid sets them two to a row.
	func testIssuesListTheirSectionsAndGridTheRest() throws {
		let front = MessFrontPage(app: app).navigate()
		front
			.openNewestIssue()
			.scrollDownALittle()
			.openSectionAndComeBack(TestIdentifiers.News.newsSection)
			.goBack()
		front.openSecondIssue()
		MessIssueScreen(app: app)
			.verifyMoreGridsItsStories()
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
	/// The page opens at AX5 on Latest already narrowed to Variety, by link: at the largest size
	/// the section menu scrolls to its chosen row as it opens, and XCUITest reads the rows' frames
	/// from before that scroll, so a tap there lands on the wrong section.
	func testHoroscopesScrollToASignPickedFromTheLastRow() throws {
		app.launchArguments += TestIdentifiers.LaunchArguments.contentSizeCategory(
			TestIdentifiers.LaunchArguments.accessibilityExtraExtraExtraLarge)
		MessFrontPage(app: app)
			.navigate(latestNarrowedTo: TestIdentifiers.News.varietySection)
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

	/// A Photo story opens dark while the setting is on, and the page it was opened from is
	/// light again after Back. With Dark page for Photo stories turned off in the paper's
	/// Customize sheet, a Photo story follows the system's appearance. The suite runs in Light
	/// Mode.
	func testPhotoStoriesOpenDarkUnlessTurnedOff() throws {
		let front = MessFrontPage(app: app)
			.navigate(latestNarrowedTo: TestIdentifiers.News.varietySection)
			.openColumn(TestIdentifiers.News.photoColumn, inShown: TestIdentifiers.News.varietySection)
		let story = front.openFirstStory().verifyHeadlineAppears()
		story.verifyPage(dark: true, "a Photo story should open in Dark Mode")
		// An error screen is dark too, so the story must still be the page on show.
		story.verifyHeadlineAppears()

		story.goBack()
		front.verifyStoryListShown()
		story.verifyPage(dark: false, "the Photo list should be light again after Back")

		// The column is a screen of its own; the paintbrush is on the one below.
		front.goBack()
		front.openCustomize()
			.keepPhotoStoriesDark(false)
			.close()
		// Latest is still narrowed to Variety, as it was left.
		front
			.openColumn(TestIdentifiers.News.photoColumn, inShown: TestIdentifiers.News.varietySection)
			.openFirstStory()
			.verifyHeadlineAppears()
			.verifyPage(dark: false, "with the setting off, a Photo story should stay light")
	}
}
