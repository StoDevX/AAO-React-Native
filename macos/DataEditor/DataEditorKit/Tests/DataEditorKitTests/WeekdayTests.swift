import Testing
@testable import DataEditorKit

@Suite struct WeekdayTests {
    /// `firstWeekday` counts as `Calendar` does: 1 is Sunday, 2 Monday, 7 Saturday.
    @Test func startsTheWeekWhereTheCalendarDoes() {
        #expect(Weekday.inWeekOrder(firstWeekday: 1) == [.Su, .Mo, .Tu, .We, .Th, .Fr, .Sa])
        #expect(Weekday.inWeekOrder(firstWeekday: 2) == [.Mo, .Tu, .We, .Th, .Fr, .Sa, .Su])
        #expect(Weekday.inWeekOrder(firstWeekday: 7) == [.Sa, .Su, .Mo, .Tu, .We, .Th, .Fr])
    }
}
