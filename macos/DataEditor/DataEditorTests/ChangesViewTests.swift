import DataEditorKit
import Testing
@testable import DataEditor

@MainActor
struct ChangesViewTests {
    private func same(_ text: String) -> DiffLine { DiffLine(kind: .same, text: text) }

    @Test func keepsTwoUnchangedLinesAroundAChange() {
        let lines = (1...4).map { same("a\($0)") } + [DiffLine(kind: .removed, text: "old"), DiffLine(kind: .added, text: "new")] + (5...8).map { same("a\($0)") }
        #expect(diffRows(lines) == [
            .line(same("a3")), .line(same("a4")),
            .line(DiffLine(kind: .removed, text: "old")), .line(DiffLine(kind: .added, text: "new")),
            .line(same("a5")), .line(same("a6")),
        ])
    }

    @Test func marksTheLinesLeftOutBetweenChanges() {
        let lines = [DiffLine(kind: .added, text: "x")] + (1...5).map { same("a\($0)") } + [DiffLine(kind: .added, text: "y")]
        #expect(diffRows(lines) == [
            .line(DiffLine(kind: .added, text: "x")), .line(same("a1")), .line(same("a2")),
            .gap,
            .line(same("a4")), .line(same("a5")), .line(DiffLine(kind: .added, text: "y")),
        ])
    }

    @Test func joinsChangesWhoseContextMeets() {
        let lines = [DiffLine(kind: .added, text: "x")] + (1...4).map { same("a\($0)") } + [DiffLine(kind: .added, text: "y")]
        #expect(diffRows(lines) == lines.map(DiffRow.line))
    }

    @Test func showsNothingForAnUnchangedFile() {
        #expect(diffRows([same("a"), same("b")]).isEmpty)
    }

    @Test func asksAboutARevertByTheBuildingsName() {
        #expect(ChangesView.revertQuestion(file: "building-hours/1-1-cage.yaml", name: "The Cage") == "Revert The Cage?")
        #expect(ChangesView.revertQuestion(file: "building-hours/1-1-cage.yaml", name: nil) == "Revert building-hours/1-1-cage.yaml?")
    }
}
