import DataEditorKit
import Testing
@testable import DataEditor

@MainActor
struct SummarySuggestionTests {
    private let cage = ChangedFile(building: "The Cage", diff: [
        DiffLine(kind: .same, text: "name: The Cage"),
        DiffLine(kind: .removed, text: "      to: '8:00pm'"),
        DiffLine(kind: .added, text: "      to: '9:00pm'"),
        DiffLine(kind: .same, text: "    - title: Hours"),
    ])

    @Test func namesEachBuildingAndOnlyTheLinesThatChanged() {
        let stav = ChangedFile(building: "Stav Hall", diff: [DiffLine(kind: .added, text: "  - title: Brunch")])
        #expect(summaryPrompt([cage, stav]) == """
            The Cage:
            - to: '8:00pm'
            + to: '9:00pm'

            Stav Hall:
            + - title: Brunch
            """)
    }

    /// The model reads a few thousand words at most; a large change is cut, not refused.
    @Test func stopsBeforeTheLimitWithoutSplittingALine() {
        let long = ChangedFile(building: "The Cage", diff: (1...100).map { DiffLine(kind: .added, text: "line \($0)") })
        #expect(summaryPrompt([long], limit: 40) == "The Cage:\n+ line 1\n+ line 2\n+ line 3")
    }

    @Test func keepsTheFirstLineWithoutQuotesOrAFullStop() {
        #expect(cleanSuggestion("Close The Cage at 9 p.m. on Fridays.") == "Close The Cage at 9 p.m. on Fridays")
        #expect(cleanSuggestion("  \"Add brunch at Stav Hall\"\nThis adds a brunch schedule.") == "Add brunch at Stav Hall")
        #expect(cleanSuggestion("“Open the Pause later”") == "Open the Pause later")
        #expect(cleanSuggestion("\n\nShorten the C-Store's hours\n") == "Shorten the C-Store's hours")
    }

    /// The full stop of "p.m." is part of the time, not the end of a sentence.
    @Test func keepsTheFullStopOfAnAbbreviation() {
        #expect(cleanSuggestion("Close The Cage at 9 p.m.") == "Close The Cage at 9 p.m.")
        #expect(cleanSuggestion("Open Stav Hall at 7 a.m..") == "Open Stav Hall at 7 a.m.")
    }
}
