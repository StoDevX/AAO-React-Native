import DataEditorKit
import SwiftUI

/// One record of a data set with a generated form: what may change it, its
/// problems, and a field for each thing its schema describes.
struct RecordFormView: View {
    @Environment(AppModel.self) private var model
    let setName: String
    let set: DataSet
    let record: RecordSummary

    private var lockReason: String? {
        AppModel.lockReason(set: set, file: record.ref.file, updating: model.updating, conflicted: model.isConflicted(record.ref.file))
    }

    /// The problems above the form: the missing fields in one line, as a new
    /// record lacks most of them at once, and each other problem on its own.
    static func summary(of problems: [Problem]) -> (fillIn: String?, others: [Problem]) {
        let missing = problems.compactMap(\.missing)
        let fillIn = missing.isEmpty ? nil : "Fill in " + missing.formatted(.list(type: .and).locale(Locale(identifier: "en_US")))
        return (fillIn, problems.filter { $0.missing == nil })
    }

    var body: some View {
        let file = record.ref.file
        Form {
            if let lockReason {
                Section { Label(lockReason, systemImage: "lock").accessibilityIdentifier("edit-lock") }
            }
            if let steers = set.steers {
                Section { Label(AppModel.steersNotice(steers), systemImage: "clock.arrow.circlepath") }
            } else if let maintainedBy = set.maintainedBy {
                Section { Label(maintainedBy, systemImage: "arrow.triangle.2.circlepath") }
            }
            let problems = model.shownProblems.filter { problem in
                (problem.path ?? []).starts(with: record.ref.path) || problem.path == nil
            }
            if !problems.isEmpty {
                let summary = Self.summary(of: problems)
                Section("Problems") {
                    if let fillIn = summary.fillIn {
                        Label { Text(fillIn) } icon: { Image(systemName: "exclamationmark.triangle.fill").foregroundStyle(.orange) }
                            .accessibilityIdentifier("problems-fill-in")
                    }
                    ForEach(Array(summary.others.enumerated()), id: \.offset) { _, problem in
                        ProblemLabel(problem: problem, fileOnScreen: model.documentFile, systemImage: "exclamationmark.triangle.fill")
                    }
                }
                .accessibilityIdentifier("problems")
            }
            // the model's schema for this set, never the last set's while this one's loads
            if let schema = model.loadedSchema(for: setName), model.documentFile == file {
                FieldRows(fields: formFields(schema: schema), base: record.ref.path, value: model.value?[path: record.ref.path],
                          file: file, recordPath: record.ref.path)
                    .disabled(lockReason != nil)
            } else {
                ProgressView()
            }
        }
        .formStyle(.grouped)
        // asks again once the files change and the model lets the schema go
        .task(id: [setName, model.loadedSchema(for: setName) == nil ? "asking" : "loaded"]) {
            _ = await model.schema(for: setName)
        }
    }
}
