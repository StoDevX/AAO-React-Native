import XCTest

@MainActor
final class ActivityUITests: XCTestCase {
    /// Two pull requests submitted before, the newer still open. UI tests ask
    /// GitHub nothing, so each keeps the state written here.
    private let submissions = """
    [
      {"submission": {"number": 9002, "url": "https://github.com/StoDevX/AAO-React-Native/pull/9002", "owner": "someone",
                      "branch": "data-editor/stav-2", "base": "c1",
                      "paths": ["data/building-hours/1-3-stav.yaml", "data/building-hours/1-1-cage.yaml"]},
       "summary": "Open Stav and the Cage later on Fridays", "submitted": "2026-11-04T15:30:00Z", "state": "open"},
      {"submission": {"number": 9001, "url": "https://github.com/StoDevX/AAO-React-Native/pull/9001", "owner": "someone",
                      "branch": "data-editor/pause-1", "base": "c0", "paths": ["data/building-hours/1-2-pause-kitchen.yaml"]},
       "summary": "Close the Pause kitchen over fall break", "submitted": "2026-10-20T18:00:00Z", "state": "merged"}
    ]
    """

    func testWithNoPullRequestsTheSidebarHasNoActivity() throws {
        let app = try launchWithRepoData().app
        let list = app.outlines["building-list"]
        XCTAssertTrue(list.staticTexts["The Cage"].waitForExistence(timeout: 20))
        XCTAssertFalse(list.staticTexts["Activity"].exists)
        attachScreenshot(of: app.windows.firstMatch, named: "Sidebar in the order the data is published")
    }

    func testChoosingAPullRequestShowsItAndChoosingABuildingGoesBack() throws {
        let app = try launchWithRepoData(submissions: submissions).app
        let list = app.outlines["building-list"]
        let newer = list.descendants(matching: .any)["pull-request-9002"]
        XCTAssertTrue(newer.waitForExistence(timeout: 20))
        selectTheCage(in: app)
        XCTAssertTrue(app.textFields["service-title-0"].waitForExistence(timeout: 10))
        // Activity is below every building
        for _ in 0..<20 where !newer.isHittable { list.scroll(byDeltaX: 0, deltaY: -500) }

        newer.click()
        let detail = app.descendants(matching: .any)["pull-request-detail"]
        XCTAssertTrue(detail.waitForExistence(timeout: 5))
        XCTAssertTrue(detail.staticTexts["Open Stav and the Cage later on Fridays"].exists)
        // the hours make way for it
        XCTAssertFalse(app.textFields["service-title-0"].exists)
        attachScreenshot(of: list, named: "Activity at the bottom of the sidebar")
        attachScreenshot(of: app.windows.firstMatch, named: "A pull request's detail")

        list.descendants(matching: .any)["pull-request-9001"].click()
        XCTAssertTrue(detail.staticTexts["Close the Pause kitchen over fall break"].waitForExistence(timeout: 5))
        attachScreenshot(of: app.windows.firstMatch, named: "A merged pull request's detail")

        let cage = list.staticTexts["The Cage"]
        for _ in 0..<20 where !cage.isHittable { list.scroll(byDeltaX: 0, deltaY: 500) }
        cage.click()
        XCTAssertTrue(app.textFields["service-title-0"].waitForExistence(timeout: 10))
        XCTAssertFalse(detail.exists)
    }
}
