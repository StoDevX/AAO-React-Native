import DataEditorKit
import Testing
@testable import DataEditor

@MainActor
struct DaySummaryTests {
    @Test func namesARunOfThreeOrMoreDaysByItsEnds() {
        #expect(daySummary([.Mo, .Tu, .We, .Th, .Fr]) == "Mon–Fri")
    }

    @Test func listsShortRunsDayByDay() {
        #expect(daySummary([.Sa, .Su]) == "Sat, Sun")
        #expect(daySummary([.Mo, .We, .Th, .Fr]) == "Mon, Wed–Fri")
        #expect(daySummary([.Su]) == "Sun")
    }

    @Test func readsTheDaysInWeekOrderWhateverOrderTheFileHasThem() {
        #expect(daySummary([.Fr, .Mo, .We, .Tu, .Th]) == "Mon–Fri")
    }
}
