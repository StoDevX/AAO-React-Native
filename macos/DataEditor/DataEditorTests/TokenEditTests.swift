import DataEditorKit
import Testing
@testable import DataEditor

/// The edits a token field makes: the fewest, so a comment beside an item the
/// contributor kept stays with it.
@MainActor
struct TokenEditTests {
    private let path: [PathKey] = ["faqs", 1, "targets"]

    @Test func removingATokenDeletesOnlyIt() {
        #expect(TokenListField.ops(at: path, from: ["a", "b", "c"], to: ["a", "c"]) == [.delete(path + [1])])
    }

    @Test func addingATokenAppendsIt() {
        #expect(TokenListField.ops(at: path, from: ["a", "b"], to: ["a", "b", "c"]) == [.set(path + [2], .string("c"))])
    }

    @Test func removingAndAddingDeleteFirstThenAppend() {
        #expect(TokenListField.ops(at: path, from: ["a", "b", "c"], to: ["a", "c", "d"])
            == [.delete(path + [1]), .set(path + [2], .string("d"))])
    }

    /// A reorder has no smaller edit than the whole list.
    @Test func reorderingWritesTheList() {
        #expect(TokenListField.ops(at: path, from: ["a", "b"], to: ["b", "a"]) == [.set(path, .array([.string("b"), .string("a")]))])
    }

    @Test func noChangeIsNoEdit() {
        #expect(TokenListField.ops(at: path, from: ["a"], to: ["a"]) == [])
    }
}
