import DataEditorKit
import Testing
@testable import DataEditor

@MainActor
struct TimeFieldTests {
    /// The field's date reads back as the time it was given, to the minute.
    @Test(arguments: ["3:08pm", "12:00am", "11:59pm"])
    func aTimeShownReadsBackTheSame(text: String) throws {
        let time = try #require(ClockTime(text))
        #expect(TimeField.clockTime(TimeField.date(time)) == time)
    }
}
