import DataEditorKit
import SwiftUI

/// One building's hours file: its problems, the week at a glance, and every schedule in it.
struct HoursDetailView: View {
    @Environment(AppModel.self) private var model
    let document: HoursDocument

    /// Why the file cannot be edited right now, if it cannot. `AppModel.apply` refuses these edits too.
    private var lockReason: String? {
        if model.updating { return "Editing waits while the data updates." }
        if let file = model.documentFile, model.isConflicted(file) { return "This file changed on GitHub too." }
        return nil
    }

    var body: some View {
        let locked = lockReason != nil
        Form {
            if let lockReason {
                Section {
                    HStack {
                        Label(lockReason, systemImage: "lock").accessibilityIdentifier("edit-lock")
                        if let file = model.documentFile, model.isConflicted(file) {
                            Spacer()
                            Button("Choose a Version…") { Task { await model.choose(ChangesetItem.overview) } }
                        }
                    }
                }
            }

            let problems = model.shownProblems
            if !problems.isEmpty {
                Section {
                    ForEach(Array(problems.enumerated()), id: \.offset) { _, problem in
                        ProblemLabel(problem: problem, fileOnScreen: model.documentFile, systemImage: "exclamationmark.triangle.fill")
                    }
                } header: { Text("Problems") }
                .accessibilityIdentifier("problems")
            }

            let notices = model.draftNotices.filter { $0.file == model.documentFile }
            if !notices.isEmpty {
                Section {
                    ForEach(Array(notices.enumerated()), id: \.offset) { index, notice in
                        HStack {
                            ProblemLabel(problem: notice, fileOnScreen: model.documentFile, systemImage: "text.badge.xmark")
                            Spacer()
                            Button("Dismiss", systemImage: "xmark") { model.dismissDraftNotice(notice) }
                                .labelStyle(.iconOnly)
                                .buttonStyle(.borderless)
                                .accessibilityLabel("Dismiss this notice")
                                .accessibilityIdentifier("dismiss-draft-notice-\(index)")
                        }
                    }
                } header: { Text("Not saved") }
            }

            Section("This week") { WeekTimeline(services: document.services) }

            ScheduleSection(title: "Usual hours", document: document, editor: ScheduleEditor(base: ["schedule"], services: document.services))
                .disabled(locked)

            Section("Exceptions") {
                ForEach(Array(document.exceptions.enumerated()), id: \.offset) { index, exception in
                    DisclosureGroup(exception.date) {
                        Group {
                            ScheduleSection(title: nil, document: document, editor: ScheduleEditor(base: ["exceptions", .index(index), "schedule"], services: exception.services))
                            Button("Remove this exception", role: .destructive) {
                                if !isRepeatClick() { Task { await model.apply([.delete(["exceptions", .index(index)])]) } }
                            }
                                // removing an exception moves the place a later one's draft is saved to
                                .disabled(model.edits.isShown || !model.unsavedDrafts.isEmpty)
                        }
                        .disabled(locked)
                    }
                }
                AddExceptionButton(count: document.exceptions.count)
                    .disabled(locked || model.edits.isShown)
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

    /// The break's own templates, then every other in breaks.yaml, each once.
    private func templates(for item: BreakCalendar.Break) -> [String] {
        (item.templates + (model.calendar?.templates ?? [])).reduce(into: []) { names, name in
            if !names.contains(name) { names.append(name) }
        }
    }

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
                        ForEach(templates(for: item), id: \.self) { name in Text(name).tag("template:\(name)") }
                        Text("Hours of its own").tag("custom")
                        if case .other? = entry { Text("Set in the file").tag("other") }
                    }
                    // leaving hours of its own takes away fields that may hold a draft
                    .disabled(model.edits.isShown || !model.unsavedDrafts.isEmpty)
                    if case .custom(let services)? = entry {
                        ScheduleSection(title: nil, document: document, editor: ScheduleEditor(base: path, services: services))
                    }
                }
            }
        }
    }
}

/// A problem's message, selectable so a draft the file refused can be copied
/// back, with the place in the file it concerns. A problem in a file other
/// than `fileOnScreen` (nil when none is) names the building it is in.
struct ProblemLabel: View {
    @Environment(AppModel.self) private var model
    let problem: Problem
    let fileOnScreen: String?
    let systemImage: String

    private var breakNames: [String: String] {
        Dictionary((model.calendar?.breaks ?? []).map { ($0.key, $0.name) }, uniquingKeysWith: { first, _ in first })
    }

    var body: some View {
        Label {
            VStack(alignment: .leading) {
                Text(problemLine(problem, fileOnScreen: fileOnScreen, buildings: model.buildings)).textSelection(.enabled)
                if let path = problem.path { Text(plainPlace(path, breakNames: breakNames)).font(.caption).foregroundStyle(.secondary) }
            }
        } icon: { Image(systemName: systemImage).foregroundStyle(.orange) }
    }
}
