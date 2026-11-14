import DataEditorKit
import Foundation
import Testing
@testable import DataEditor

@MainActor
struct SummarySuggestionTests {
    /// The model is asked about one building at a time and never names it.
    @Test func listsWhatChangedInOneBuilding() {
        let cage = ChangedFile(record: "The Cage", changes: ["Hours: no longer open Sat–Sun", "Hours: note removed"])
        #expect(summaryPrompt(cage) == "- Hours: no longer open Sat–Sun\n- Hours: note removed")
    }

    /// The model reads a few thousand words at most; a large change is cut, not refused.
    @Test func stopsBeforeTheLimitWithoutSplittingALine() {
        let long = ChangedFile(record: "The Cage", changes: (1...100).map { "line \($0)" })
        #expect(summaryPrompt(long, limit: 26) == "- line 1\n- line 2\n- line 3")
    }

    /// The app names each building, once: the model dropped the second one and named the first twice.
    @Test func namesEachBuildingAfterWhatChangedThere() {
        #expect(summary(of: [("The Cage", "Close on weekends"), ("Stav Hall", "Add Sunday brunch")])
            == "Close on weekends at The Cage; Add Sunday brunch at Stav Hall")
        #expect(summary(of: [("The Cage", ""), ("Stav Hall", "Add Sunday brunch")]) == "Add Sunday brunch at Stav Hall")
    }

    @Test func keepsTheFirstLineWithoutQuotesOrAFullStop() {
        #expect(cleanSuggestion("Close The Cage at 9 p.m. on Fridays.") == "Close The Cage at 9 p.m. on Fridays")
        #expect(cleanSuggestion("  \"Add brunch at Stav Hall\"\nThis adds a brunch schedule.") == "Add brunch at Stav Hall")
        #expect(cleanSuggestion("“Open the Pause later”") == "Open the Pause later")
        #expect(cleanSuggestion("\n\nShorten the C-Store's hours\n") == "Shorten the C-Store's hours")
    }

    /// The full stop of "p.m." is part of the time, not the end of a sentence.
    /// Suggest is tuned on hours, so a contact or the privacy policy is never read as a building.
    @Test func describesOnlyHoursFiles() throws {
        let catalog = try JSONDecoder().decode(DataSetCatalog.self, from: Data(#"{"groups":[],"sets":{"building-hours":{"title":"Hours","record":"Building","shape":"folder","path":"building-hours","schema":"building-hours","form":"hours"},"contact-info":{"title":"Important Contacts","record":"Contact","shape":"folder","path":"contact-info","schema":"contact-info"},"privacy":{"title":"Privacy Policy","record":"Privacy Policy","shape":"document","path":"privacy.md"}}}"#.utf8))
        #expect(AppModel.describable(["building-hours/1-1-cage.yaml", "contact-info/1-1-pubsafe.yaml", "privacy.md"], catalog: catalog)
            == ["building-hours/1-1-cage.yaml"])
    }

    @Test func keepsTheFullStopOfAnAbbreviation() {
        #expect(cleanSuggestion("Close The Cage at 9 p.m.") == "Close The Cage at 9 p.m.")
        #expect(cleanSuggestion("Open Stav Hall at 7 a.m..") == "Open Stav Hall at 7 a.m.")
    }
}
