import DataEditorKit
import Foundation
import Testing
@testable import DataEditor

@MainActor
struct OverviewTests {
    private let cageFile = "building-hours/1-1-cage.yaml"
    private let cage = BuildingSummary(file: "building-hours/1-1-cage.yaml", name: "The Cage", category: "Food")
    private let stav = BuildingSummary(file: "building-hours/1-3-stav.yaml", name: "Stav Hall", category: "Food")

    private func parts(history: SubmissionHistory = SubmissionHistory(), newerCommit: String? = nil, conflicts: [String] = [],
                       changedFiles: [String] = [], buildProblems: [Problem] = [], hasBuilt: Bool = true) -> OverviewParts {
        OverviewParts.make(history: history, newerCommit: newerCommit, conflicts: conflicts, changedFiles: changedFiles,
                           buildProblems: buildProblems, hasBuilt: hasBuilt)
    }

    /// The screen once said "No changes yet" beneath a conflict.
    @Test func aConflictAloneIsNotEmpty() {
        #expect(!parts(conflicts: [cageFile]).isEmpty)
    }

    @Test func nothingChangedIsEmptyButStillOffersNewerData() {
        let parts = parts(newerCommit: "abc")
        #expect(parts.isEmpty)
        #expect(parts.newerData)
    }

    @Test func showsTheOpenPullRequest() {
        #expect(parts(history: history(record(7, .open))).pullRequest?.id == 7)
    }

    /// Merged shows, with Get the Latest Data, until a new pull request takes its place.
    @Test func aMergedPullRequestStaysUntilTheNextSubmission() {
        #expect(parts(history: history(record(7, .merged))).pullRequest?.id == 7)
        #expect(parts(history: history(record(6, .merged), record(7, .open))).pullRequest?.id == 7)
    }

    @Test func noPullRequestBeforeTheFirst() {
        #expect(parts().pullRequest == nil)
    }

    @Test func thePreviewNamesTheFileThatStopsIt() {
        let parts = parts(buildProblems: [Problem(file: cageFile, message: "bad", path: nil)])
        #expect(parts.preview == .stopsAt(file: cageFile))
        #expect(parts.preview?.text(buildings: [cage]) == "The preview stops at The Cage")
        #expect(parts.preview?.text(buildings: []) == "The preview stops at building-hours/1-1-cage.yaml")
    }

    /// A build that never ran names no file.
    @Test func aBuildThatDidNotRunSaysSo() {
        let parts = parts(buildProblems: [Problem(file: nil, message: "The build did not run", path: nil)])
        #expect(parts.preview == .failed)
        #expect(parts.preview?.text(buildings: []) == "The preview couldn't be updated")
    }

    @Test func aGoodBuildIsUpToDate() {
        #expect(parts().preview == .upToDate)
        #expect(PreviewLine.upToDate.text(buildings: []) == "The preview is up to date")
    }

    @Test func noPreviewLineBeforeTheFirstBuild() {
        #expect(parts(hasBuilt: false).preview == nil)
    }

    @Test func currentChangesListEveryBuilding() {
        #expect(changesetBuildings(.current, all: [cage, stav], history: SubmissionHistory()) == [cage, stav])
    }

    @Test func aPastPullRequestListsOnlyItsFilesAndNamesOnesNoLongerListed() {
        let history = history(record(7, .open, paths: ["data/building-hours/1-1-cage.yaml", "data/building-hours/9-9-gone.yaml"]))
        let shown = changesetBuildings(.pullRequest(number: 7), all: [cage, stav], history: history)
        #expect(shown.map(\.name) == ["The Cage", "9-9-gone.yaml"])
    }

    /// The editor shows its own file's problems; the Overview shows the rest.
    @Test func theEditorShowsOnlyItsOwnFilesProblems() {
        let mine = Problem(file: cageFile, message: "bad", path: nil)
        let other = Problem(file: stav.file, message: "bad", path: nil)
        #expect(AppModel.editorProblems(of: cageFile, open: [mine], build: [mine, other]) == [mine])
    }
}
