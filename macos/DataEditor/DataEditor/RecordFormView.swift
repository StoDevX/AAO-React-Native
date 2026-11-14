import DataEditorKit
import SwiftUI

/// One record of a data set with a generated form: what may change it, its
/// problems, and a field for each thing its schema describes.
struct RecordFormView: View {
    @Environment(AppModel.self) private var model
    let setName: String
    let set: DataSet
    let record: RecordSummary
    @State private var schema: JSONValue?

    private var lockReason: String? {
        AppModel.lockReason(set: set, file: record.ref.file, updating: model.updating, conflicted: model.isConflicted(record.ref.file))
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
                Section("Problems") {
                    ForEach(Array(problems.enumerated()), id: \.offset) { _, problem in
                        ProblemLabel(problem: problem, fileOnScreen: model.documentFile, systemImage: "exclamationmark.triangle.fill")
                    }
                }
                .accessibilityIdentifier("problems")
            }
            if let schema, model.documentFile == file {
                FieldRows(fields: formFields(schema: schema), base: record.ref.path, value: model.value?[path: record.ref.path],
                          file: file, recordPath: record.ref.path)
                    .disabled(lockReason != nil)
            } else {
                ProgressView()
            }
        }
        .formStyle(.grouped)
        .task(id: setName) { schema = await model.schema(for: setName) }
    }
}
