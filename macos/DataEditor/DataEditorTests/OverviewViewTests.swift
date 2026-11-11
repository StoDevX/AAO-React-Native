import DataEditorKit
import Foundation
import Testing
@testable import DataEditor

@MainActor
struct OverviewViewTests {
    private func same(_ text: String) -> DiffLine { DiffLine(kind: .same, text: text) }

    @Test func asksAboutARevertByTheBuildingsName() {
        #expect(OverviewView.revertQuestion(file: "building-hours/1-1-cage.yaml", name: "The Cage") == "Revert The Cage?")
        #expect(OverviewView.revertQuestion(file: "building-hours/1-1-cage.yaml", name: nil) == "Revert building-hours/1-1-cage.yaml?")
    }

    /// A file waiting for a choice needs the contributor on the Overview as much as an edit does.
    @Test func countsConflictsInTheBadge() {
        #expect(ContentView.changeCount(changedFiles: [], conflicts: []) == 0)
        #expect(ContentView.changeCount(changedFiles: [], conflicts: ["a.yaml"]) == 1)
        #expect(ContentView.changeCount(changedFiles: ["a.yaml", "b.yaml"], conflicts: ["a.yaml", "c.yaml"]) == 3)
    }

    @Test func comparesTheContributorsVersionWithGitHubs() {
        let mine = Workspace.ConflictCopy.kept(Data("name: Mine\nkind: space\n".utf8))
        #expect(AppModel.conflictDiff(github: Data("name: GitHub\nkind: space\n".utf8), mine: mine) == [
            DiffLine(kind: .removed, text: "name: GitHub"), DiffLine(kind: .added, text: "name: Mine"), same("kind: space"),
        ])
        // GitHub removed the file the contributor edited
        #expect(AppModel.conflictDiff(github: nil, mine: mine)?.allSatisfy { $0.kind == .added } == true)
        // a deleted file has no lines of the contributor's to compare
        #expect(AppModel.conflictDiff(github: Data("name: GitHub\n".utf8), mine: .deleted) == nil)
    }
}
