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

	/// The fields are one form that scrolls itself. When the fields and the
	/// description shared a scrolling page, a field that wrapped left the
	/// fields' frame too short, and the jobs-site link got stuck at the bottom
	/// of the screen.
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
