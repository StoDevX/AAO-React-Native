import DataEditorKit
import SwiftUI

/// A time of day as the data writes it, `3:08pm`, set to the minute in the
/// system's time field. A value that is no time, such as a bus trip's `false`
/// for a stop it skips, is shown and left as it is.
struct TimeField: View {
    let title: String
    let value: JSONValue?
    /// whether an edit is in flight, which a change would have to wait behind
    let editing: Bool
    let set: (String) -> Void

    /// `time` on a fixed day in UTC, which the field shows in UTC too, so no clock change moves it.
    static func date(_ time: ClockTime) -> Date { Date(timeIntervalSinceReferenceDate: Double(time.minutes * 60)) }

    static func clockTime(_ date: Date) -> ClockTime {
        let parts = Calendar.utc.dateComponents([.hour, .minute], from: date)
        return ClockTime(minutes: (parts.hour ?? 0) * 60 + (parts.minute ?? 0))
    }

    var body: some View {
        if let text = value?.string, let time = ClockTime(text) {
            DatePicker(title, selection: Binding(get: { Self.date(time) }, set: { chosen in
                let new = Self.clockTime(chosen)
                if new != time { set(new.text) }
            }), displayedComponents: .hourAndMinute)
                .datePickerStyle(.stepperField)
                .environment(\.timeZone, .gmt)
                .disabled(editing)
        } else {
            LabeledContent(title) {
                Text(value == .bool(false) ? "—" : value?.fieldText ?? "").foregroundStyle(.secondary)
            }
        }
    }
}

extension Calendar {
    /// The Gregorian calendar in UTC, which reads the time a `TimeField` shows.
    static let utc: Calendar = {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = .gmt
        return calendar
    }()
}
