import DataEditorKit
import SwiftUI

/// One building's hours file: its problems, the week at a glance, and every schedule in it.
struct HoursDetailView: View {
    @Environment(AppModel.self) private var model
    let document: HoursDocument

    /// Why the file cannot be edited right now, if it cannot. `AppModel.apply` refuses these edits too.
    private var lockReason: String? {
        if model.updating { return "Editing waits while the data updates." }
        if let file = model.selection, model.isConflicted(file) { return "Choose which copy to keep in Changes to edit this file." }
        return nil
    }

    var body: some View {
        let locked = lockReason != nil
        Form {
            if let lockReason {
                Section { Label(lockReason, systemImage: "lock") }
            }

            if !model.problems.isEmpty || !model.buildProblems.isEmpty {
                Section {
                    ForEach(Array((model.problems + model.buildProblems).enumerated()), id: \.offset) { _, problem in
                        Label {
                            VStack(alignment: .leading) {
                                Text(problem.message)
                                if let path = problem.path { Text(path.map(\.description).joined(separator: " › ")).font(.caption).foregroundStyle(.secondary) }
                            }
                        } icon: { Image(systemName: "exclamationmark.triangle.fill").foregroundStyle(.orange) }
                    }
                } header: { Text("Problems") }
                .accessibilityIdentifier("problems")
            }

            Section("This week") { WeekTimeline(services: document.services) }

            ScheduleSection(title: "Usual hours", editor: ScheduleEditor(base: ["schedule"], services: document.services))
                .disabled(locked)

            Section("Exceptions") {
                ForEach(Array(document.exceptions.enumerated()), id: \.offset) { index, exception in
                    DisclosureGroup(exception.date) {
                        Group {
                            ScheduleSection(title: nil, editor: ScheduleEditor(base: ["exceptions", .index(index), "schedule"], services: exception.services))
                            Button("Remove this exception", role: .destructive) { Task { await model.apply([.delete(["exceptions", .index(index)])]) } }
                        }
                        .disabled(locked)
                    }
                }
                AddExceptionButton(count: document.exceptions.count)
                    .disabled(locked)
            }

            BreaksSection(document: document)
                .disabled(locked)
        }
        .formStyle(.grouped)
        .navigationTitle(document.name)
        .navigationSubtitle(document.category)
    }
}

/// Adds a closed exception on a chosen day, for the contributor to fill in.
private struct AddExceptionButton: View {
    @Environment(AppModel.self) private var model
    let count: Int
    @State private var date = Date.now

    var body: some View {
        HStack {
            DatePicker("New exception", selection: $date, displayedComponents: .date)
            Button("Add") {
                // the day as the picker shows it, not as it falls in UTC
                let day = date.formatted(Date.ISO8601FormatStyle(timeZone: .current).year().month().day())
                Task {
                    await model.apply([.set(["exceptions", .index(count)], .object([
                        "date": .string(day),
                        "schedule": .array([.object(["title": .string("Hours"), "isPhysicallyOpen": .bool(false), "hours": .array([])])]),
                    ]))])
                }
            }
        }
    }
}

/// For each break in breaks.yaml, whether this building keeps the break's
/// default hours, a named template, or hours of its own.
private struct BreaksSection: View {
    @Environment(AppModel.self) private var model
    let document: HoursDocument

    var body: some View {
        Section("Breaks") {
            ForEach(model.calendar?.breaks ?? []) { item in
                let entry = document.breakSchedule[item.key]
                let path: [PathKey] = ["breakSchedule", .key(item.key)]
                VStack(alignment: .leading) {
                    Picker("\(item.name) (\(item.start) to \(item.end))", selection: Binding<String>(
                        get: {
                            switch entry {
                            case .template(let name)?: "template:\(name)"
                            case .custom?: "custom"
                            case .other?: "other"
                            case nil: "usual"
                            }
                        },
                        set: { choice in
                            Task {
                                if choice == "usual" { await model.apply([.delete(path)]) }
                                else if choice == "custom" {
                                    await model.apply([.set(path, .array([.object(["title": .string("Hours"), "isPhysicallyOpen": .bool(false), "hours": .array([])])]))])
                                } else if choice.hasPrefix("template:") {
                                    await model.apply([.set(path, .string(String(choice.dropFirst("template:".count))))])
                                }
                            }
                        }
                    )) {
                        Text("The break's default").tag("usual")
                        ForEach(item.templates + (model.calendar?.templates ?? []), id: \.self) { name in Text(name).tag("template:\(name)") }
                        Text("Hours of its own").tag("custom")
                        if case .other? = entry { Text("Set in the file").tag("other") }
                    }
                    if case .custom(let services)? = entry {
                        ScheduleSection(title: nil, editor: ScheduleEditor(base: path, services: services))
                    }
                }
            }
        }
    }
}
