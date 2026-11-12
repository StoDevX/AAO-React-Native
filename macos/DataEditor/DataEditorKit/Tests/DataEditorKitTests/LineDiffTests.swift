import Testing
@testable import DataEditorKit

struct LineDiffTests {
    @Test func marksChangedLines() {
        let diff = lineDiff(old: "a\nb\nc\n", new: "a\nB\nc\n")
        #expect(diff == [
            DiffLine(kind: .same, text: "a"),
            DiffLine(kind: .removed, text: "b"),
            DiffLine(kind: .added, text: "B"),
            DiffLine(kind: .same, text: "c"),
        ])
    }

    @Test func showsANewFileAsAdded() {
        #expect(lineDiff(old: "", new: "x\n") == [DiffLine(kind: .added, text: "x")])
    }
}
