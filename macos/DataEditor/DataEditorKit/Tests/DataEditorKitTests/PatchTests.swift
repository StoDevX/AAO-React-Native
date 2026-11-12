import Testing
@testable import DataEditorKit

@Suite struct PatchTests {
    private func same(_ text: String) -> DiffLine { DiffLine(kind: .same, text: text) }

    @Test func readsAHunk() {
        let patch = """
        @@ -3,3 +3,3 @@ schedule:
           hours:
        -    - {days: [Mo], from: '7:30am', to: '8:00pm'}
        +    - {days: [Mo], from: '7:30am', to: '9:00pm'}
        """
        #expect(parsePatch(patch) == [
            .line(same("  hours:")),
            .line(DiffLine(kind: .removed, text: "    - {days: [Mo], from: '7:30am', to: '8:00pm'}")),
            .line(DiffLine(kind: .added, text: "    - {days: [Mo], from: '7:30am', to: '9:00pm'}")),
        ])
    }

    @Test func putsAGapBetweenHunks() {
        let patch = "@@ -1,1 +1,1 @@\n-a\n+b\n@@ -9,1 +9,1 @@\n-c\n+d"
        #expect(parsePatch(patch) == [
            .line(DiffLine(kind: .removed, text: "a")), .line(DiffLine(kind: .added, text: "b")),
            .gap,
            .line(DiffLine(kind: .removed, text: "c")), .line(DiffLine(kind: .added, text: "d")),
        ])
    }

    @Test func skipsTheNoNewlineMarker() {
        #expect(parsePatch("@@ -1 +1 @@\n-a\n\\ No newline at end of file\n+a\n") == [
            .line(DiffLine(kind: .removed, text: "a")), .line(DiffLine(kind: .added, text: "a")),
        ])
    }

    @Test func readsAnEmptyPatchAsNoRows() { #expect(parsePatch("") == []) }

    @Test func keepsThreeUnchangedLinesAroundAChange() {
        let lines = (1...4).map { same("a\($0)") } + [DiffLine(kind: .removed, text: "old"), DiffLine(kind: .added, text: "new")] + (5...8).map { same("a\($0)") }
        #expect(diffRows(lines) == [
            .line(same("a2")), .line(same("a3")), .line(same("a4")),
            .line(DiffLine(kind: .removed, text: "old")), .line(DiffLine(kind: .added, text: "new")),
            .line(same("a5")), .line(same("a6")), .line(same("a7")),
        ])
    }

    @Test func marksTheLinesLeftOutBetweenChanges() {
        let lines = [DiffLine(kind: .added, text: "x")] + (1...7).map { same("a\($0)") } + [DiffLine(kind: .added, text: "y")]
        #expect(diffRows(lines) == [
            .line(DiffLine(kind: .added, text: "x")), .line(same("a1")), .line(same("a2")), .line(same("a3")),
            .gap,
            .line(same("a5")), .line(same("a6")), .line(same("a7")), .line(DiffLine(kind: .added, text: "y")),
        ])
    }

    @Test func joinsChangesWhoseContextMeets() {
        let lines = [DiffLine(kind: .added, text: "x")] + (1...6).map { same("a\($0)") } + [DiffLine(kind: .added, text: "y")]
        #expect(diffRows(lines) == lines.map(DiffRow.line))
    }

    @Test func showsNothingForAnUnchangedFile() {
        #expect(diffRows([same("a"), same("b")]).isEmpty)
    }
}
