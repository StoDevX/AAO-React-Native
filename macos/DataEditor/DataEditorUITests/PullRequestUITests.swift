import XCTest

@MainActor
final class PullRequestUITests: XCTestCase {
    /// Two pull requests submitted before, the newer still open. UI tests ask
    /// GitHub nothing, so each keeps the state written here.
    private let submissions = """
    [
      {"submission": {"number": 9002, "url": "https://github.com/StoDevX/AAO-React-Native/pull/9002", "owner": "someone",
                      "branch": "data-editor/stav-2", "base": "c1",
                      "paths": ["data/building-hours/1-3-stav.yaml", "data/building-hours/1-1-cage.yaml"]},
       "summary": "Open Stav and the Cage later on Fridays", "submitted": "2026-11-04T15:30:00Z", "state": "open",
       "tooLarge": [], "isFinal": false,
       "diffs": {"building-hours/1-1-cage.yaml": [
         {"line": {"_0": {"kind": "same", "text": "    hours:"}}},
         {"line": {"_0": {"kind": "removed", "text": "      - {days: [Fr], from: '7:30am', to: '8:00pm'}"}}},
         {"line": {"_0": {"kind": "added", "text": "      - {days: [Fr], from: '7:30am', to: '10:00pm'}"}}}]}},
      {"submission": {"number": 9001, "url": "https://github.com/StoDevX/AAO-React-Native/pull/9001", "owner": "someone",
                      "branch": "data-editor/pause-1", "base": "c0", "paths": ["data/building-hours/1-2-pause-kitchen.yaml"]},
       "summary": "Close the Pause kitchen over fall break", "submitted": "2026-10-20T18:00:00Z", "state": "merged",
       "tooLarge": [], "isFinal": false}
    ]
    """

    func testAPastPullRequestOpensReadOnly() throws {
        let app = try launchWithRepoData(submissions: submissions).app
        let changesets = app.windows["Changesets"]
        let list = changesets.outlines["changeset-list"]
        let newer = list.descendants(matching: .any)["pull-request-9002"]
        XCTAssertTrue(newer.waitForExistence(timeout: 20))
        XCTAssertTrue(list.staticTexts["Submitted"].exists)
        newer.click()
        XCTAssertTrue(changesets.staticTexts["Open Stav and the Cage later on Fridays"].waitForExistence(timeout: 5))
        attachScreenshot(of: changesets, named: "Changesets window on a past pull request")
        newer.doubleClick()

        let window = app.windows.containing(.outline, identifier: "pull-request-building-list").firstMatch
        XCTAssertTrue(window.waitForExistence(timeout: 5))
        XCTAssertTrue(window.staticTexts["+       - {days: [Fr], from: '7:30am', to: '10:00pm'}"].exists)
        // its list holds only what it changed
        let buildings = window.outlines["pull-request-building-list"]
        XCTAssertTrue(buildings.staticTexts["Stav Hall"].exists)
        XCTAssertTrue(buildings.staticTexts["The Cage"].exists)
        XCTAssertFalse(buildings.staticTexts["Boe Chapel"].exists)
        attachScreenshot(of: window, named: "A past pull request's window")

        buildings.staticTexts["The Cage"].click()
        let file = window.descendants(matching: .any)["pull-request-file"]
        XCTAssertTrue(file.waitForExistence(timeout: 5))
        XCTAssertTrue(file.staticTexts["-       - {days: [Fr], from: '7:30am', to: '8:00pm'}"].exists)
        // read only: no editor
        XCTAssertFalse(window.textFields["service-title-0"].exists)
        attachScreenshot(of: window, named: "A past pull request's file, read only")

        // ⌘0 brings the Changesets window back in front of the one it opened
        app.typeKey("0", modifierFlags: .command)
        list.descendants(matching: .any)["pull-request-9001"].click()
        XCTAssertTrue(changesets.staticTexts["Close the Pause kitchen over fall break"].waitForExistence(timeout: 5))
        attachScreenshot(of: changesets, named: "A merged pull request with no saved diffs")
    }
}
