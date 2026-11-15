import DataEditorKit
import SwiftUI

/// A date, or a date and time, as the data writes it: `2026-11-14`, or
/// `2026-11-14T15:20:00Z`. A value it can't read stays as text, and a field
/// with no date offers to add one rather than showing a date the file lacks.
struct DateField: View {
    let title: String
    /// `.date` or `.dateTime`
    let kind: FieldKind
    let value: String?
    let set: (String?) -> Void

    private static let day = Date.ISO8601FormatStyle(timeZone: .gmt).year().month().day()
    private static let moment = Date.ISO8601FormatStyle(timeZone: .gmt)

    private var style: Date.ISO8601FormatStyle { kind == .dateTime ? Self.moment : Self.day }

    static func date(_ text: String, kind: FieldKind) -> Date? {
        try? (kind == .dateTime ? moment : day).parse(text)
    }

    var body: some View {
        if let value, let date = Self.date(value, kind: kind) {
            DatePicker(title, selection: Binding(get: { date }, set: { set($0.formatted(style)) }),
                       displayedComponents: kind == .dateTime ? [.date, .hourAndMinute] : [.date])
                .datePickerStyle(.field)
                .environment(\.timeZone, .gmt)
        } else if let value {
            LabeledContent(title) { Text(value).foregroundStyle(.red) }
        } else {
            LabeledContent(title) {
                Button("Add Date") { set(Date().formatted(style)) }
            }
        }
    }
}
