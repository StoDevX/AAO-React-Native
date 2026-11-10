import DataEditorKit
import SwiftUI

/// The services of one schedule, each with its rows, editable.
struct ScheduleSection: View {
    @Environment(AppModel.self) private var model
    let title: String?
    let editor: ScheduleEditor

    private func apply(_ ops: EditOp...) { Task { await model.apply(ops) } }

    var body: some View {
        ForEach(Array(editor.services.enumerated()), id: \.offset) { s, service in
            Section {
                TextField("Title", text: Binding(get: { service.title }, set: { apply(editor.setTitle(service: s, $0)) }))
                TextField("Notes", text: Binding(get: { service.notes ?? "" }, set: { apply(editor.setNotes(service: s, $0)) }), axis: .vertical)
                Toggle("Closed", isOn: Binding(get: { service.isPhysicallyOpen == false && service.rows.isEmpty },
                                              set: { closed in Task { await model.apply(editor.setClosed(service: s, closed)) } }))
                ForEach(Array(service.rows.enumerated()), id: \.offset) { r, row in
                    RowEditor(row: row, service: s, index: r, editor: editor)
                }
                HStack {
                    Button("Add hours", systemImage: "plus") { apply(editor.addRow(service: s)) }
                        .accessibilityIdentifier("add-row-\(s)")
                    Spacer()
                    if let remove = editor.removeService(s) {
                        Button("Remove \(service.title.isEmpty ? "service" : service.title)", role: .destructive) { apply(remove) }
                    }
                }
            } header: {
                Text(s == 0 ? (title ?? service.title) : service.title)
            }
        }
        Button("Add a service", systemImage: "plus.rectangle.on.rectangle") { apply(editor.addService(title: "New service")) }
    }
}

/// One row of hours: its days as toggles, and its open and close times.
private struct RowEditor: View {
    @Environment(AppModel.self) private var model
    let row: HoursRow
    let service: Int
    let index: Int
    let editor: ScheduleEditor

    /// A close before the open runs into the next day, as `HoursRow.segments()`
    /// reads it. A close of midnight ends the day, and a close equal to the open
    /// is no window at all, so neither is labelled.
    private var closesNextDay: Bool {
        guard let from = row.from, let to = row.to else { return false }
        return to < from && to.minutes != 0
    }

    var body: some View {
        HStack {
            ForEach(Weekday.allCases, id: \.self) { day in
                Toggle(day.label, isOn: Binding(
                    get: { row.days.contains(day) },
                    set: { on in
                        let days = on ? row.days + [day] : row.days.filter { $0 != day }
                        // a row needs at least one day
                        if !days.isEmpty { Task { await model.apply([editor.setDays(service: service, row: index, days)]) } }
                    }
                ))
                .toggleStyle(.button)
            }
            Spacer()
            TimePicker(text: row.fromText, identifier: "row-time-from-\(service)-\(index)") { time in
                Task { await model.apply([editor.setTime(service: service, row: index, end: .from, time)]) }
            }
            Text("to")
            TimePicker(text: row.toText, identifier: "row-time-to-\(service)-\(index)") { time in
                Task { await model.apply([editor.setTime(service: service, row: index, end: .to, time)]) }
            }
            if closesNextDay {
                Text("next day").font(.caption).foregroundStyle(.secondary)
            }
            Button("Remove", systemImage: "minus.circle") { Task { await model.apply([editor.removeRow(service: service, row: index)]) } }
                .labelStyle(.iconOnly)
        }
    }
}

/// Every quarter hour, plus the file's own value if it is between them.
private struct TimePicker: View {
    let text: String
    let identifier: String
    let set: @MainActor @Sendable (ClockTime) -> Void

    private var options: [ClockTime] {
        guard let current = ClockTime(text), !ClockTime.quarterHours.contains(current) else { return ClockTime.quarterHours }
        return (ClockTime.quarterHours + [current]).sorted()
    }

    var body: some View {
        Picker("", selection: Binding(get: { ClockTime(text) ?? ClockTime(minutes: 0) }, set: set)) {
            ForEach(options, id: \.self) { Text($0.text).tag($0) }
        }
        .labelsHidden()
        .fixedSize()
        .accessibilityIdentifier(identifier)
    }
}
