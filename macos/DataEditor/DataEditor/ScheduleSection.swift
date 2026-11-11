import AppKit
import DataEditorKit
import SwiftUI

/// The services of one schedule, each with its rows, editable.
struct ScheduleSection: View {
    @Environment(AppModel.self) private var model
    let title: String?
    /// the file on screen, as its parent read it, so the section never pairs one file with another's services
    let document: HoursDocument
    let editor: ScheduleEditor

    private func apply(_ ops: EditOp...) { Task { await model.apply(ops) } }

    /// What service `s` holds in the file on screen.
    private func schedule(_ s: Int) -> JSONValue? { document.value[path: editor.servicePath(s)] }

    var body: some View {
        let file = model.documentFile ?? ""
        ForEach(Array(editor.services.enumerated()), id: \.offset) { s, service in
            Section {
                DraftField(label: "Title", file: file, value: service.title, schedule: schedule(s)) { file, text, expected, schedule in
                    await model.applyDraft(editor.setTitle(service: s, text), to: file, replacing: expected, schedule: schedule)
                }
                    .accessibilityIdentifier("service-title-\(s)")
                DraftField(label: "Notes", file: file, value: service.notes ?? "", schedule: schedule(s), axis: .vertical) { file, text, expected, schedule in
                    await model.applyDraft(editor.setNotes(service: s, text), to: file, replacing: expected, schedule: schedule)
                }
                .accessibilityIdentifier("service-notes-\(s)")
                Group {
                    Toggle("Closed", isOn: Binding(get: { service.isPhysicallyOpen == false && service.rows.isEmpty },
                                                  set: { closed in Task { await model.apply(editor.setClosed(service: s, closed)) } }))
                        .accessibilityIdentifier("closed-\(s)")
                    ForEach(Array(service.rows.enumerated()), id: \.offset) { r, row in
                        RowEditor(row: row, service: s, index: r, editor: editor)
                    }
                    HStack {
                        Button("Add hours", systemImage: "plus") { apply(editor.addRow(service: s)) }
                            .accessibilityIdentifier("add-row-\(s)")
                        Spacer()
                        if let remove = editor.removeService(s) {
                            Button("Remove This Schedule", role: .destructive) { if !isRepeatClick() { apply(remove) } }
                                // removing a service moves the place a later service's draft is saved to
                                .disabled(!model.unsavedDrafts.isEmpty)
                                .help(model.unsavedDrafts.isEmpty ? "" : "Press Return to save what you typed first.")
                                .accessibilityIdentifier("remove-service-\(s)")
                        }
                    }
                }
                // each of these edits names a row or service by its place, which the edit in flight may move
                .disabled(model.editing)
            } header: {
                Text(s == 0 ? (title ?? service.title) : service.title)
            }
        }
        Button("Add a schedule", systemImage: "plus.rectangle.on.rectangle") { apply(editor.addService(title: "New schedule")) }
            .disabled(model.editing)
    }
}

/// A text field that edits the file once the contributor is done: on Return,
/// when it loses focus, when it goes, or when the model asks before Changes,
/// Submit or quitting. An edit per keystroke would race its own replies, and
/// a late reply would put back text already typed over.
///
/// The draft remembers the file it was typed for and the text it began from.
/// Choosing another building can swap the document under a field that keeps
/// focus, and the draft must still land in its own file. Until the helper
/// takes the text the field keeps it: nothing reloads over it, and it is sent
/// again on Return or when focus leaves.
private struct DraftField: View {
    @Environment(AppModel.self) private var model
    let label: String
    /// the file on screen
    let file: String
    /// what that file holds
    let value: String
    /// what the field's schedule holds in that file
    let schedule: JSONValue?
    var axis: Axis = .horizontal
    /// saves `text` in `file`, in the schedule that held `schedule` when the draft began and `expected` in this field
    let commit: (_ file: String, _ text: String, _ expected: String, _ schedule: JSONValue?) async -> AppModel.DraftOutcome
    @State private var draft = ""
    /// the file `draft` was typed for
    @State private var draftFile = ""
    /// what that file held when the draft began; the draft is unsaved while it differs
    @State private var base = ""
    /// what the field's schedule held when the draft began, to find it by if it moves
    @State private var scheduleAtStart: JSONValue?
    @State private var id = UUID()
    /// The commit waiting for the helper, if any. One at a time, so each
    /// commit's `expected` is the text the one before it saved.
    @State private var committing: Task<Void, Never>?
    @FocusState private var focused: Bool

    private func commitIfChanged() {
        guard draft != base, committing == nil else { return }
        let (file, text, expected, schedule) = (draftFile, draft, base, scheduleAtStart)
        committing = Task {
            let outcome = await commit(file, text, expected, schedule)
            committing = nil
            guard draftFile == file else { return }
            switch outcome {
            case .saved:
                base = text
                // what was typed while this one waited
                commitIfChanged()
            case .letGo(let current), .savedElsewhere(let current):
                // the text is in its schedule's new place, or quoted in a notice; the field starts afresh from the file
                draft = current
                base = current
            case .notSaved:
                break
            }
        }
    }

    /// Saves the draft now, after any commit under way, and returns whether
    /// nothing typed is left unsaved. Text let go is in a notice, not lost.
    private func save() async -> Bool {
        while let commit = committing { await commit.value }
        commitIfChanged()
        while let commit = committing { await commit.value }
        return draft == base
    }

    private func load() {
        draft = value
        draftFile = file
        base = value
    }

    var body: some View {
        TextField(label, text: $draft, axis: axis)
            .focused($focused)
            .onSubmit(commitIfChanged)
            .onChange(of: draft) { old, _ in
                if old == base { scheduleAtStart = schedule }
            }
            .onChange(of: focused) { _, isFocused in
                guard !isFocused else { return }
                // with nothing typed, catch up with a file changed while focused (a revert)
                if draft == base, value != draft { load() } else { commitIfChanged() }
            }
            .onAppear {
                load()
                model.registerDraftSaver(id) { await save() }
            }
            .onDisappear {
                commitIfChanged()
                model.noteDraft(id, unsaved: false)
                model.unregisterDraftSaver(id)
            }
            .onChange(of: file) {
                commitIfChanged()
                load()
            }
            // the same file changed, by this field's edit or another; unsaved text stays
            .onChange(of: value) { if file == draftFile, !focused, draft == base { load() } }
            .onChange(of: draft != base) { _, unsaved in model.noteDraft(id, unsaved: unsaved) }
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
            DayPicker(week: model.week, days: row.days) { days in
                Task { await model.apply([editor.setDays(service: service, row: index, days)]) }
            }
            .accessibilityIdentifier("days-\(service)-\(index)")
            Spacer()
            TimePicker(label: "Opens", text: row.fromText, identifier: "row-time-from-\(service)-\(index)") { time in
                Task { await model.apply([editor.setTime(service: service, row: index, end: .from, time)]) }
            }
            Text("to")
            TimePicker(label: "Closes", text: row.toText, identifier: "row-time-to-\(service)-\(index)") { time in
                Task { await model.apply([editor.setTime(service: service, row: index, end: .to, time)]) }
            }
            if closesNextDay {
                Text("next day").font(.caption).foregroundStyle(.secondary)
            }
            Button("Remove \(daySummary(row.days, week: model.week)) \(row.fromText) to \(row.toText)", systemImage: "minus.circle") {
                if !isRepeatClick() { Task { await model.apply([editor.removeRow(service: service, row: index)]) } }
            }
                .labelStyle(.iconOnly)
                .accessibilityIdentifier("remove-row-\(service)-\(index)")
        }
    }
}

/// Every quarter hour, plus the file's own value if it is between them.
private struct TimePicker: View {
    /// read by VoiceOver; the row shows no label
    let label: String
    let text: String
    let identifier: String
    let set: @MainActor @Sendable (ClockTime) -> Void

    private var options: [ClockTime] {
        guard let current = ClockTime(text), !ClockTime.quarterHours.contains(current) else { return ClockTime.quarterHours }
        return (ClockTime.quarterHours + [current]).sorted()
    }

    var body: some View {
        Picker(label, selection: Binding(get: { ClockTime(text) ?? ClockTime(minutes: 0) }, set: set)) {
            ForEach(options, id: \.self) { Text($0.text).tag($0) }
        }
        .labelsHidden()
        .fixedSize()
        .accessibilityIdentifier(identifier)
    }
}

/// Whether the click being handled is the second or later of a double-click.
/// The first click's edit has often landed by then, so the button under the
/// pointer belongs to the next row, which the contributor never meant to remove.
/// A key press or an accessibility press is never a repeat; only a mouse event
/// has a click count, and asking another kind for one raises.
func isRepeatClick(_ event: NSEvent? = NSApp.currentEvent) -> Bool {
    guard let event, event.type == .leftMouseDown || event.type == .leftMouseUp else { return false }
    return event.clickCount > 1
}

/// The days of a row as a person reads them: `Mon–Fri`, `Sat, Sun`, `Mon, Wed–Fri`.
/// A run of three or more days is named by its ends, a shorter one day by day.
/// Days follow `week`, so a run never crosses the week's end.
func daySummary(_ days: [Weekday], week: [Weekday] = Weekday.allCases) -> String {
    var runs: [[Weekday]] = []
    for (position, day) in week.enumerated() where days.contains(day) {
        if let last = runs.last?.last, position > 0, week[position - 1] == last {
            runs[runs.count - 1].append(day)
        } else {
            runs.append([day])
        }
    }
    return runs.flatMap { run in
        run.count >= 3 ? ["\(run.first!.label)–\(run.last!.label)"] : run.map(\.label)
    }.joined(separator: ", ")
}
