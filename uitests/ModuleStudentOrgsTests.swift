import XCTest

class ModuleStudentOrgsTests: UITestCaseUnbooted {
	/// A refined search starts its results at the top, not wherever the list
	/// was scrolled before: each query is a new list (`id(query)` in
	/// source/features/student-orgs/org-results-list.tsx). The org list is a
	/// recorded fixture under UI tests, long enough that the first search's
	/// results take several screens.
	func testRefiningASearchFromFarDownTheResultsStartsAtTheTop() throws {
		StudentOrgsScreen(app: app)
			.navigate()
			.search(for: TestIdentifiers.StudentOrgs.firstQuery)
			.scrollResultsDown()
			.refineSearch(appending: TestIdentifiers.StudentOrgs.refinement)
			.verifyResultsStartAtTheTop(with: TestIdentifiers.StudentOrgs.firstRefinedResult)
	}
}
