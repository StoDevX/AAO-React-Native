import Testing
@testable import DataEditorKit

struct JSONValuePathTests {
    private let file: JSONValue = .object([
        "schedule": .array([
            .object(["title": .string("Hours")]),
            .object(["title": .string("Lunch")]),
        ]),
    ])

    @Test func followsKeysAndIndexes() {
        #expect(file[path: ["schedule", .index(1), "title"]] == .string("Lunch"))
    }

    @Test func findsNothingWherePathLeavesTheFile() {
        #expect(file[path: ["schedule", .index(2), "title"]] == nil)
        #expect(file[path: ["schedule", "title"]] == nil)
    }

    @Test func anEmptyPathIsTheWholeFile() {
        #expect(file[path: []] == file)
    }
}
