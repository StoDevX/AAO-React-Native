import DataEditorKit
import Testing
@testable import DataEditor

@MainActor
struct SummarySuggestionTests {
    private let cage = ChangedFile(building: "The Cage", changes: ["Hours: Mon–Fri 7:30am–8pm → Mon–Fri 7:30am–9pm"])

    @Test func namesEachBuildingAndWhatChangedInIt() {
        let stav = ChangedFile(building: "Stav Hall", changes: ["Brunch added: Sun 10am–1pm"])
        #expect(summaryPrompt([cage, stav]) == """
            The Cage:
            - Hours: Mon–Fri 7:30am–8pm → Mon–Fri 7:30am–9pm

            Stav Hall:
            - Brunch added: Sun 10am–1pm
            """)
    }

    /// The model reads a few thousand words at most; a large change is cut, not refused.
    @Test func stopsBeforeTheLimitWithoutSplittingALine() {
        let long = ChangedFile(building: "The Cage", changes: (1...100).map { "line \($0)" })
        #expect(summaryPrompt([long], limit: 40) == "The Cage:\n- line 1\n- line 2\n- line 3")
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
