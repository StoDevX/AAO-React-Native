import DataEditorKit
import SwiftUI

/// A bus line's schedules, each a timetable: its days, its stops, and a grid
/// with the stops across and one row per trip. Its coordinates and closures
/// keep the form's own fields.
struct BusTimetables: View {
    @Environment(AppModel.self) private var model
    let schedules: [JSONValue]
    /// where the schedules are in the file
    let base: [PathKey]
    /// the fields of one schedule, for the coordinates and closures
    let scheduleFields: [FormField]
    let file: String
    let recordPath: [PathKey]

    /// A schedule to fill in: weekdays, no stops yet, no trips.
    private static let newSchedule: JSONValue = .object([
        "days": .array(["Mo", "Tu", "We", "Th", "Fr"].map(JSONValue.string)), "stops": .array([]), "times": .array([]),
    ])

    var body: some View {
        ForEach(Array(schedules.enumerated()), id: \.offset) { index, schedule in
            BusTimetable(number: index + 1, schedule: schedule, base: base + [.index(index)],
                         otherFields: scheduleFields.filter { ["coordinates", "closures"].contains($0.key) },
                         file: file, recordPath: recordPath)
        }
        Section {
            Button("Add Schedule", systemImage: "plus") {
                // a new line has no schedules at all, so the first is the whole list
                let ops: [EditOp] = schedules.isEmpty ? [.set(base, .array([Self.newSchedule]))]
                    : [.set(base + [.index(schedules.count)], Self.newSchedule)]
                Task { await model.apply(ops, to: file) }
            }
            .accessibilityIdentifier("timetable-add-schedule")
            .disabled(model.edits.isShown)
        }
    }
}

/// One schedule's timetable. Each identifier names the schedule by its number, from 1.
private struct BusTimetable: View {
    @Environment(AppModel.self) private var model
    let number: Int
    let schedule: JSONValue
    let base: [PathKey]
    let otherFields: [FormField]
    let file: String
    let recordPath: [PathKey]

    private var timetable: BusSchedule { BusSchedule(schedule) }

    private func apply(_ ops: [EditOp]) { Task { await model.apply(ops, to: file) } }

    /// Applies a change that may come many times in a row, as a stepper held does, after any edit in flight.
    private func applyLatest(_ ops: [EditOp], key: String) {
        Task { await model.applyLatest(ops, to: file, key: file + "#timetable-\(number)-" + key) }
    }

    var body: some View {
        let timetable = timetable
        let editing = model.edits.isShown
        Section {
            LabeledContent("Days") {
                DayPicker(week: model.week, days: schedule["days"]?.array?.compactMap { $0.string.flatMap(Weekday.init(rawValue:)) } ?? []) { days in
                    applyLatest([.set(base + ["days"], .array(days.map { .string($0.rawValue) }))], key: "days")
                }
                .accessibilityIdentifier("timetable-\(number)-days")
            }
            ForEach(Array(timetable.stops.enumerated()), id: \.offset) { index, name in
                HStack {
                    StopNameField(name: name, identifier: "timetable-\(number)-stop-\(index)") { renamed in
                        apply(timetable.renameStop(at: index, to: renamed, at: base))
                    }
                    Group {
                        Button("Add a Stop After \(name)", systemImage: "plus.circle") {
                            apply(timetable.insertStop("New Stop", at: index + 1, at: base))
                        }
                        .accessibilityIdentifier("timetable-\(number)-stop-insert-\(index)")
                        Button("Move \(name) Earlier", systemImage: "arrow.up") { apply(timetable.moveStop(from: index, to: index - 1, at: base)) }
                            .disabled(index == 0)
                        Button("Move \(name) Later", systemImage: "arrow.down") { apply(timetable.moveStop(from: index, to: index + 1, at: base)) }
                            .disabled(index == timetable.stops.count - 1)
                        Button("Remove \(name)", systemImage: "minus.circle", role: .destructive) {
                            if !isRepeatClick() { apply(timetable.removeStop(at: index, at: base)) }
                        }
                    }
                    .labelStyle(.iconOnly)
                    .buttonStyle(.borderless)
                    .disabled(editing)
                }
            }
            Button("Add Stop", systemImage: "plus") {
                apply(timetable.insertStop("New Stop", at: timetable.stops.count, at: base))
            }
            .disabled(editing)
            TimetableGrid(number: number, timetable: timetable, editing: editing,
                          apply: { apply($0(base)) }, applyLatest: { key, ops in applyLatest(ops(base), key: key) })
            Button("Add Trip", systemImage: "plus") { apply(timetable.addTrip(at: base)) }
                .accessibilityIdentifier("timetable-\(number)-add-trip")
                .disabled(editing)
        } header: {
            HStack {
                Text("Schedule \(number)")
                Spacer()
                Button("Remove Schedule \(number)", systemImage: "minus.circle", role: .destructive) {
                    if !isRepeatClick() { apply([.delete(base)]) }
                }
                .labelStyle(.iconOnly)
                .buttonStyle(.borderless)
                .disabled(editing)
            }
        }
        FieldRows(fields: otherFields, base: base, value: schedule, file: file, recordPath: recordPath)
    }
}

/// The trips as a grid: a column per stop, headed by its name, and a row per trip.
private struct TimetableGrid: View {
    let number: Int
    let timetable: BusSchedule
    let editing: Bool
    /// applies the edits a change builds at the schedule's path
    let apply: (@escaping ([PathKey]) -> [EditOp]) -> Void
    /// applies a cell's change after any edit in flight, the newest of a run of them standing
    let applyLatest: (String, @escaping ([PathKey]) -> [EditOp]) -> Void

    var body: some View {
        let late = Set(timetable.outOfOrder().map { [$0.trip, $0.stop] })
        let odd = Set(timetable.unreadable)
        ScrollView(.horizontal) {
            Grid(alignment: .leading, horizontalSpacing: 8, verticalSpacing: 4) {
                GridRow {
                    Text("Trip").foregroundStyle(.secondary)
                    ForEach(Array(timetable.stops.enumerated()), id: \.offset) { _, stop in
                        Text(stop).font(.caption).bold().lineLimit(2).frame(width: 96, alignment: .leading)
                    }
                    Color.clear.frame(width: 1, height: 1)
                }
                ForEach(Array(timetable.trips.enumerated()), id: \.offset) { trip, times in
                    GridRow {
                        Text("\(trip + 1)").foregroundStyle(.secondary).monospacedDigit()
                        ForEach(Array(timetable.stops.indices), id: \.self) { stop in
                            cell(trip: trip, stop: stop, time: times.indices.contains(stop) ? times[stop] : nil,
                                 late: late.contains([trip, stop]), unreadable: odd.contains([trip, stop]),
                                 written: writtenText(trip, stop))
                        }
                        Button("Remove Trip \(trip + 1)", systemImage: "minus.circle", role: .destructive) {
                            if !isRepeatClick() { apply { timetable.removeTrips([trip], at: $0) } }
                        }
                        .labelStyle(.iconOnly)
                        .buttonStyle(.borderless)
                        .disabled(editing)
                    }
                }
            }
            .padding(.vertical, 4)
        }
    }

    /// One trip's time at one stop: a time field, or a dash where the trip
    /// skips the stop; either one's menu switches between the two.
    /// What the file holds at a cell, as text.
    private func writtenText(_ trip: Int, _ stop: Int) -> String? { timetable.written(trip: trip, stop: stop) }

    @ViewBuilder private func cell(trip: Int, stop: Int, time: ClockTime?, late: Bool, unreadable: Bool, written: String?) -> some View {
        // the cell's identifiers end in its trip and stop, from 0
        let id = { (what: String) in "timetable-\(number)-\(what)-\(trip)-\(stop)" }
        HStack(spacing: 2) {
            if let time {
                TimeCell(time: time, identifier: id("cell"), label: "Trip \(trip + 1) at \(timetable.stops[stop])",
                         set: { new in applyLatest(id("cell")) { timetable.setTime(trip: trip, stop: stop, new, at: $0) } },
                         skip: { applyLatest(id("cell")) { timetable.setTime(trip: trip, stop: stop, nil, at: $0) } })
                if late {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundStyle(.orange)
                        .help("Earlier than the stop before it")
                        .accessibilityLabel("Earlier than the stop before it")
                        .accessibilityIdentifier(id("flag"))
                }
            } else if unreadable {
                // a time the schema allows but the grid can't read, such as 3:8pm: shown as written
                Text(written ?? "")
                    .foregroundStyle(.red)
                    .help("Not a time the timetable reads. Write it as 3:08pm.")
                    .accessibilityIdentifier(id("unreadable"))
            } else {
                Text("—")
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .contentShape(Rectangle())
                    .accessibilityIdentifier(id("skipped"))
                    .contextMenu {
                        // the stop before's time, or noon, as somewhere to start
                        let before = timetable.trips[trip][..<stop].compactMap { $0 }.last ?? ClockTime(minutes: 720)
                        Button("Stops Here") { apply { timetable.setTime(trip: trip, stop: stop, before, at: $0) } }
                    }
            }
        }
        .frame(width: 96, alignment: .leading)
    }
}

/// A stop's name, saved when the contributor presses Return or leaves the field.
private struct StopNameField: View {
    let name: String
    let identifier: String
    let rename: (String) -> Void
    @State private var draft = ""
    @FocusState private var focused: Bool

    private func commit() {
        let typed = draft.trimmingCharacters(in: .whitespaces)
        if !typed.isEmpty, typed != name { rename(typed) } else { draft = name }
    }

    var body: some View {
        TextField("Stop", text: $draft)
            .focused($focused)
            .onSubmit(commit)
            .onChange(of: focused) { _, isFocused in if !isFocused { commit() } }
            .onAppear { draft = name }
            .onChange(of: name) { _, renamed in draft = renamed }
            .accessibilityIdentifier(identifier)
    }
}

/// One trip's time at one stop in AppKit's time field, whose menu offers to
/// mark the stop skipped. SwiftUI's menu on a time field never opens.
private struct TimeCell: NSViewRepresentable {
    let time: ClockTime
    let identifier: String
    let label: String
    let set: (ClockTime) -> Void
    let skip: () -> Void

    /// AppKit's time field takes a right-click for its own and shows no menu, so this one shows its `menu`.
    final class Picker: NSDatePicker {
        override func rightMouseDown(with event: NSEvent) {
            // a locked line's cells take no edit, by menu either
            guard isEnabled else { return }
            if let menu { NSMenu.popUpContextMenu(menu, with: event, for: self) } else { super.rightMouseDown(with: event) }
        }
    }

    func makeNSView(context: Context) -> Picker {
        let picker = Picker()
        picker.datePickerStyle = .textFieldAndStepper
        picker.datePickerElements = .hourMinute
        picker.timeZone = .gmt
        picker.target = context.coordinator
        picker.action = #selector(Coordinator.changed(_:))
        let menu = NSMenu()
        let item = NSMenuItem(title: "Doesn't Stop Here", action: #selector(Coordinator.skip), keyEquivalent: "")
        item.target = context.coordinator
        menu.addItem(item)
        picker.menu = menu
        return picker
    }

    func updateNSView(_ picker: Picker, context: Context) {
        context.coordinator.parent = self
        picker.dateValue = TimeField.date(time)
        picker.setAccessibilityIdentifier(identifier)
        picker.setAccessibilityLabel(label)
        picker.isEnabled = context.environment.isEnabled
    }

    func makeCoordinator() -> Coordinator { Coordinator(parent: self) }

    final class Coordinator: NSObject {
        var parent: TimeCell
        init(parent: TimeCell) { self.parent = parent }

        @objc func changed(_ picker: NSDatePicker) {
            let new = TimeField.clockTime(picker.dateValue)
            if new != parent.time { parent.set(new) }
        }

        @objc func skip() { parent.skip() }
    }
}
