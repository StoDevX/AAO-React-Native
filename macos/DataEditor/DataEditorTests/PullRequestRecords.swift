import DataEditorKit
import Foundation
@testable import DataEditor

/// Pull request `number` in `state`, touching `paths` (The Cage's file unless given).
@MainActor func record(_ number: Int, _ state: SubmissionState?, paths: [String] = ["data/building-hours/1-1-cage.yaml"]) -> SubmissionRecord {
    let submission = Submission(number: number, url: URL(string: "https://github.com/StoDevX/AAO-React-Native/pull/\(number)")!,
                                owner: "someone", branch: "data-editor/\(number)", base: "c1", paths: paths)
    return SubmissionRecord(submission: submission, summary: "Change \(number)",
                            submitted: Date(timeIntervalSince1970: 1_800_000_000 + Double(number)), state: state)
}

/// A history holding `records`, each newer than the one before.
@MainActor func history(_ records: SubmissionRecord...) -> SubmissionHistory {
    var history = SubmissionHistory()
    for record in records { history.add(record) }
    return history
}
