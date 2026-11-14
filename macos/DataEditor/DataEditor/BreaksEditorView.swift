import DataEditorKit
import SwiftUI

/// The break calendar: each break's dates, and the closures buildings take
/// during a break. Problems come from the schedule check, as an hours file's do.
struct BreaksEditorView: View {
    @Environment(AppModel.self) private var model
    let calendar: BreaksDocument
    @State private var newName = ""

    private static let chicago = TimeZone(identifier: "America/Chicago")!

    /// The day `text` names, at noon in Minnesota, so no time zone moves it to the next or last day.
    private static func day(_ text: String?) -> Date {
        guard let text, let date = try? Date(text, strategy: .iso8601.year().month().day().dateSeparator(.dash)) else { return .now }
        return date.addingTimeInterval(12 * 3600)
    }

    private static func text(_ date: Date) -> String {
        var style = Date.ISO8601FormatStyle.iso8601.year().month().day().dateSeparator(.dash)
        style.timeZone = chicago
        return date.formatted(style)
    }

    private func apply(_ ops: [EditOp]) { Task { await model.apply(ops) } }

    var body: some View {
        let locked = model.updating || model.documentFile.map(model.isConflicted) == true
        Form {
            let problems = model.shownProblems
            if !problems.isEmpty {
                Section("Problems") {
                    ForEach(Array(problems.enumerated()), id: \.offset) { _, problem in
                        ProblemLabel(problem: problem, fileOnScreen: model.documentFile, systemImage: "exclamationmark.triangle.fill")
                    }
                }
            }
            Section("Breaks") {
                ForEach(calendar.breaks) { entry in
                    HStack {
                        Text(entry.name)
                        Spacer()
                        if entry.start == nil, entry.end == nil, let date = entry.date {
                            DatePicker("Date", selection: Binding(get: { Self.day(date) }, set: { apply([calendar.setDate(key: entry.key, date: Self.text($0))]) }),
                                       displayedComponents: .date)
                                .labelsHidden()
                        } else {
                            DatePicker("From", selection: Binding(get: { Self.day(entry.start) }, set: {
                                apply(calendar.setDates(key: entry.key, start: Self.text($0), end: entry.end ?? Self.text($0)))
                            }), displayedComponents: .date)
                            .labelsHidden()
                            Text("to")
                            DatePicker("To", selection: Binding(get: { Self.day(entry.end) }, set: {
                                apply(calendar.setDates(key: entry.key, start: entry.start ?? Self.text($0), end: Self.text($0)))
                            }), displayedComponents: .date)
                            .labelsHidden()
                        }
                        Button("Remove \(entry.name)", systemImage: "minus.circle", role: .destructive) {
                            if !isRepeatClick() { apply([calendar.removeBreak(key: entry.key)]) }
                        }
                        .labelStyle(.iconOnly)
                        .buttonStyle(.borderless)
                    }
                    .accessibilityIdentifier("break-\(entry.key)")
                }
                HStack {
                    TextField("New break", text: $newName)
                    Button("Add", systemImage: "plus") {
                        let name = newName.trimmingCharacters(in: .whitespaces)
                        let key = name.lowercased().split(whereSeparator: { !$0.isLetter && !$0.isNumber }).joined(separator: "-")
                        guard !key.isEmpty, !calendar.breaks.contains(where: { $0.key == key }) else { return }
                        newName = ""
                        apply([calendar.addBreak(key: key, name: name)])
                    }
                    .disabled(newName.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
            // a template is a schedule buildings name for a break, edited as an hours file's are
            ForEach(calendar.templates, id: \.self) { template in
                ScheduleSection(title: template, document: HoursDocument(value: calendar.value),
                                editor: ScheduleEditor(base: ["templates", .key(template)],
                                                       services: services(in: calendar.value["templates"]?[template])))
            }
        }
        .formStyle(.grouped)
        .disabled(locked)
    }
}
