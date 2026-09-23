import XCTest

class ModuleSISTests: UITestCase {
	// MARK: - Balances (need fresh state)

	func testHasAcknowledgementVisibleByDefault() throws {
		// Relaunch with fresh state to clear any prior "I Agree" acceptance
		relaunchWithFreshState()

		SISScreen(app: app)
			.navigate()
			.checkAcknowledgement()
	}

	func testShowsBalancesAfterAcknowledgement() throws {
		relaunchWithFreshState()

		SISScreen(app: app)
			.navigate()
			.acceptAcknowledgement()
			.checkAcknowledgementDismissed()
			.checkBalancesVisible()
			.checkMealPlanVisible()
	}

	func testContinuesToShowBalancesAfterReopening() throws {
		relaunchWithFreshState()

		SISScreen(app: app)
			.navigate()
			.acceptAcknowledgement()
			.checkBalancesVisible()
			.checkAcknowledgementNotPresent()
			.navigateBack()
			.waitForHomescreenVisible()
			.navigateToSISAgain()
	}

	// MARK: - Tabs

	func testOpenJobsTabCanBeOpened() throws {
		SISScreen(app: app)
			.navigate()
			.openJobsTab()
	}

	func testJobPostingLinksOutToTheJobsSite() throws {
		SISScreen(app: app)
			.navigate()
			.openJobsTab()
			.openJobPosting(TestIdentifiers.SIS.fixtureJobWithShortFields)
			.checkJobsSiteLinkIsExternal()
	}

	/// The fields are one form that scrolls itself, so its last row can reach
	/// the screen. A form nested in another scroll view, sized to its content,
	/// comes out too short when a field wraps, and a drag then stops with the
	/// jobs-site link pinned at the bottom of the screen.
	func testJobPostingFieldsScrollToTheJobsSiteLink() throws {
		SISScreen(app: app)
			.navigate()
			.openJobsTab()
			.openJobPosting(TestIdentifiers.SIS.fixtureJobWithWrappingField)
			.dragJobPostingFieldsUp()
			.capture("Job posting fields scrolled to the end")
			.checkJobsSiteLinkReachable()
	}

	func testJobDescriptionOpensOnItsOwnScreen() throws {
		SISScreen(app: app)
			.navigate()
			.openJobsTab()
			.openJobPosting(TestIdentifiers.SIS.fixtureJobWithWrappingField)
			.openJobDescription()
			.capture("Job description screen")
			.checkJobDescriptionShown()
	}
}
