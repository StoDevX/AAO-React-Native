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

    /// Adds a stop called New Stop at `index`, and once it is there focuses its name to type over.
    private func addStop(at index: Int, to timetable: BusSchedule) {
        Task {
            // asked only after the edit lands: the stop now at `index` would otherwise take it
            if await model.apply(timetable.insertStop("New Stop", at: index, at: base), to: file) {
                model.focusRequest = base + ["stops", .index(index)]
            }
        }
    }

    /// Applies a change to `path` that may come many times in a row, as a
    /// stepper held does, after any edit in flight. It is built from the
    /// schedule as the file holds it then, and dropped if its stops or trips
    /// have changed since, as its trip and stop numbers would land on other cells.
    private func applyLatest(at path: [PathKey], _ build: @escaping (BusSchedule) -> [EditOp]) {
        let (base, stops, trips) = (base, timetable.stops, timetable.trips.count)
        Task {
            await model.applyLatest(to: file, at: path) { held in
                guard let schedule = held[path: base] else { return [] }
                let now = BusSchedule(schedule)
                return now.stops == stops && now.trips.count == trips ? build(now) : []
            }
        }
    }

    var body: some View {
        let timetable = timetable
        let editing = model.edits.isShown
        Section {
            LabeledContent("Days") {
                DayPicker(week: model.week, days: schedule["days"]?.array?.compactMap { $0.string.flatMap(Weekday.init(rawValue:)) } ?? []) { days in
                    applyLatest(at: base + ["days"]) { [base] _ in [.set(base + ["days"], .array(days.map { .string($0.rawValue) }))] }
                }
                .accessibilityIdentifier("timetable-\(number)-days")
            }
            ForEach(Array(timetable.stops.enumerated()), id: \.offset) { index, name in
                HStack {
                    CommitField(label: "Stop", text: name, identifier: "timetable-\(number)-stop-\(index)",
                                place: base + ["stops", .index(index)]) { renamed in
                        guard !renamed.isEmpty else { return false }
                        apply(timetable.renameStop(at: index, to: renamed, at: base))
                        return true
                    }
                    Group {
                        Button("Add a Stop After \(name)", systemImage: "plus.circle") {
                            addStop(at: index + 1, to: timetable)
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
                addStop(at: timetable.stops.count, to: timetable)
            }
            .disabled(editing)
            TimetableGrid(number: number, timetable: timetable, editing: editing,
                          apply: { apply($0(base)) }, applyLatest: { cell, build in applyLatest(at: base + cell) { build($0, base) } })
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
    /// applies a change to a cell, at its path in the schedule, after any edit
    /// in flight, built from the schedule as the file holds it then
    let applyLatest: ([PathKey], @escaping (BusSchedule, [PathKey]) -> [EditOp]) -> Void

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
                let place: [PathKey] = ["times", .index(trip), .index(stop)]
                TimeCell(time: time, identifier: id("cell"), label: "Trip \(trip + 1) at \(timetable.stops[stop])",
                         set: { new in applyLatest(place) { $0.setTime(trip: trip, stop: stop, new, at: $1) } },
                         skip: { applyLatest(place) { $0.setTime(trip: trip, stop: stop, nil, at: $1) } })
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
                    .contextMenu {
                        Button("Replace with a Time") {
                            apply { timetable.setTime(trip: trip, stop: stop, timetable.startingTime(trip: trip, stop: stop), at: $0) }
                        }
                        Button("Doesn't Stop Here") { apply { timetable.setTime(trip: trip, stop: stop, nil, at: $0) } }
                    }
            } else {
                Text("—")
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .contentShape(Rectangle())
                    .accessibilityIdentifier(id("skipped"))
                    .contextMenu {
                        // the stop before's time, or noon, as somewhere to start
                        Button("Stops Here") {
                            apply { timetable.setTime(trip: trip, stop: stop, timetable.startingTime(trip: trip, stop: stop), at: $0) }
                        }
                    }
            }
        }
        .frame(width: 96, alignment: .leading)
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
