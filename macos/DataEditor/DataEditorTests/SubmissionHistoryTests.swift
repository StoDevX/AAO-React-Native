import DataEditorKit
import Foundation
import Testing
@testable import DataEditor

@MainActor
struct SubmissionHistoryTests {
    private func record(_ number: Int, _ state: SubmissionState?) -> SubmissionRecord {
        let submission = Submission(number: number, url: URL(string: "https://github.com/StoDevX/AAO-React-Native/pull/\(number)")!,
                                    owner: "someone", branch: "data-editor/\(number)", base: "c1",
                                    paths: ["data/building-hours/1-1-cage.yaml"])
        return SubmissionRecord(submission: submission, summary: "Change \(number)",
                                submitted: Date(timeIntervalSince1970: 1_800_000_000 + Double(number)), state: state)
    }

    private func history(_ records: SubmissionRecord...) -> SubmissionHistory {
        var history = SubmissionHistory()
        // each is newer than the one before
        for record in records { history.add(record) }
        return history
    }

    @Test func listsTheNewestFirst() {
        #expect(history(record(1, .merged), record(2, .open)).records.map(\.id) == [2, 1])
    }

    /// A new submission updates this one, so it is the newest that may still take commits.
    @Test func theCurrentRecordIsTheNewestNotYetMergedOrClosed() {
        #expect(history(record(1, .merged), record(2, .open)).current?.id == 2)
        #expect(history(record(1, .merged), record(2, .changesRequested)).current?.id == 2)
        // a pull request whose state is unknown may still be open
        #expect(history(record(1, .closed), record(2, nil)).current?.id == 2)
    }

    @Test func hasNoCurrentRecordOnceTheNewestIsFinished() {
        #expect(history(record(1, .closed), record(2, .merged)).current == nil)
        #expect(history().current == nil)
    }

    /// A merged or closed pull request takes no more commits, so its state no longer changes.
    @Test func checksOnlyRecordsNotYetMergedOrClosed() {
        let checked = history(record(1, .merged), record(2, .closed), record(3, .changesRequested), record(4, .open), record(5, nil))
        #expect(checked.needingCheck.map(\.id) == [5, 4, 3])
    }

    @Test func recordsAStateForOneRecordOnly() {
        var records = history(record(1, .open), record(2, .open))
        records.record(.merged, for: 1)
        #expect(records.records.map(\.state) == [.open, .merged])
        // a failed check leaves the state unknown
        records.record(nil, for: 2)
        #expect(records.records.map(\.state) == [nil, .merged])
    }

    @Test func replacesASubmissionWithItsUpdate() {
        var records = history(record(1, .open))
        let old = records.records[0].submission
        let updated = Submission(number: 1, url: old.url, owner: old.owner, branch: old.branch, base: old.base,
                                 paths: old.paths + ["data/building-hours/1-3-stav.yaml"])
        records.replace(updated)
        #expect(records.records[0].submission == updated)
        #expect(records.records[0].summary == "Change 1")
    }

    @Test func forgettingRemovesThatRecordAlone() {
        var records = history(record(1, .merged), record(2, .open), record(3, nil))
        records.forget(3)
        #expect(records.records.map(\.id) == [2, 1])
    }

    @Test func savesAndLoadsTheRecords() throws {
        let folder = FileManager.default.temporaryDirectory.appending(path: "history \(UUID().uuidString)")
        try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: folder) }
        let file = folder.appending(path: "submissions.json")
        let saved = history(record(1, .merged), record(2, .changesRequested), record(3, nil))
        saved.save(to: file)
        #expect(SubmissionHistory(contentsOf: file) == saved)
    }

    @Test func loadsNothingFromAMissingOrUnreadableFile() throws {
        let folder = FileManager.default.temporaryDirectory.appending(path: "history \(UUID().uuidString)")
        try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: folder) }
        let file = folder.appending(path: "submissions.json")
        #expect(SubmissionHistory(contentsOf: file).records.isEmpty)
        try Data("not json".utf8).write(to: file)
        #expect(SubmissionHistory(contentsOf: file).records.isEmpty)
    }

    @Test func namesTheChangedFilesAsTheDataFolderDoes() {
        #expect(record(1, .open).changedFiles == ["building-hours/1-1-cage.yaml"])
    }
}
