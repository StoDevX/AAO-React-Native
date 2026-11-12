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

    /// Where the week starts on Sunday, a run reads from Sunday, and the weekend splits across the week.
    @Test func readsTheDaysInTheWeekGiven() {
        let sundayFirst = Weekday.inWeekOrder(firstWeekday: 1)
        #expect(daySummary([.Su, .Mo, .Tu], week: sundayFirst) == "Sun–Tue")
        #expect(daySummary([.Sa, .Su], week: sundayFirst) == "Sun, Sat")
        #expect(daySummary([.Mo, .Tu, .We, .Th, .Fr], week: sundayFirst) == "Mon–Fri")
    }

    /// The files list days Monday first, whatever week the Mac shows, so a diff never reorders them.
    @Test func savesDaysMondayFirstWhateverTheWeekShown() {
        #expect(DayPicker.daysToSave([.Sa, .Su, .Mo]) == [.Mo, .Sa, .Su])
    }
}
