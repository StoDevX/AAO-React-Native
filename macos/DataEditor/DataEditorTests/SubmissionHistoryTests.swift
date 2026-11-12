import DataEditorKit
import Foundation
import Testing
@testable import DataEditor

@MainActor
struct SubmissionHistoryTests {
    /// A fresh folder for a history file, removed when `body` returns.
    private func inFolder(_ body: (URL) throws -> Void) throws {
        let folder = FileManager.default.temporaryDirectory.appending(path: "history \(UUID().uuidString)")
        try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: folder) }
        try body(folder)
    }

    @Test func listsTheNewestFirst() {
        #expect(history(record(1, .merged), record(2, .open)).records.map(\.id) == [2, 1])
    }

    /// A new submission updates this one, so it is the newest that may still take commits.
    @Test func theCurrentRecordIsTheNewestNotYetMergedOrClosed() {
        #expect(history(record(1, .merged), record(2, .open)).current?.id == 2)
        #expect(history(record(1, .merged), record(2, .changesRequested)).current?.id == 2)
        // a pull request not yet checked may still be open
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

    @Test func takesGitHubsAnswerForOneRecordOnly() {
        var records = history(record(1, .open), record(2, .open))
        var failures = CheckFailures()
        records.take(.success(.merged), for: 1, failures: &failures)
        #expect(records.records.map(\.state) == [.open, .merged])
        #expect(failures == CheckFailures())
    }

    /// Offline or rate-limited, the record keeps what GitHub last said, and the failure is noted beside it.
    @Test func aFailedCheckKeepsTheLastKnownState() {
        var records = history(record(1, .changesRequested))
        var failures = CheckFailures()
        records.take(.failure(URLError(.notConnectedToInternet)), for: 1, failures: &failures)
        #expect(records.records[0].state == .changesRequested)
        #expect(failures.unanswered == [1])
        #expect(failures.gone.isEmpty)
    }

    /// Only a pull request GitHub says is gone may be forgotten, so that is noted apart.
    @Test func notesAPullRequestGitHubSaysIsGone() {
        var records = history(record(1, .open))
        var failures = CheckFailures()
        records.take(.failure(SubmitError.github(404, "Not Found")), for: 1, failures: &failures)
        #expect(failures.gone == [1])
        // a rate limit next time says nothing about whether it is there
        records.take(.failure(SubmitError.github(403, "API rate limit exceeded")), for: 1, failures: &failures)
        #expect(failures.gone.isEmpty)
        #expect(failures.unanswered == [1])
    }

    @Test func anAnswerClearsTheFailuresNoted() {
        var records = history(record(1, .open))
        var failures = CheckFailures()
        records.take(.failure(SubmitError.github(404, "Not Found")), for: 1, failures: &failures)
        records.take(.success(.closed), for: 1, failures: &failures)
        #expect(records.records[0].state == .closed)
        #expect(failures == CheckFailures())
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
        try inFolder { folder in
            let file = folder.appending(path: "submissions.json")
            let saved = history(record(1, .merged), record(2, .changesRequested), record(3, nil))
            saved.save(to: file)
            let loaded = SubmissionHistory.load(from: file)
            #expect(loaded.history == saved)
            #expect(loaded.setAside == nil)
        }
    }

    @Test func loadsNothingFromAMissingFile() throws {
        try inFolder { folder in
            let loaded = SubmissionHistory.load(from: folder.appending(path: "submissions.json"))
            #expect(loaded.history.records.isEmpty)
            #expect(loaded.setAside == nil)
        }
    }

    /// A record a later build wrote, or a file cut short, must not take the
    /// readable records with it, nor be lost when the history is next saved.
    @Test func keepsTheReadableRecordsAndSetsTheFileAside() throws {
        try inFolder { folder in
            let file = folder.appending(path: "submissions.json")
            history(record(1, .merged), record(2, .open)).save(to: file)
            let text = try String(contentsOf: file, encoding: .utf8).replacingOccurrences(of: "\"merged\"", with: "\"draft\"")
            try Data(text.utf8).write(to: file)

            let loaded = SubmissionHistory.load(from: file)
            #expect(loaded.history.records.map(\.id) == [2])
            let aside = try #require(loaded.setAside)
            loaded.history.save(to: file)
            #expect(try String(contentsOf: aside, encoding: .utf8) == text)
        }
    }

    @Test func setsAnUnreadableFileAside() throws {
        try inFolder { folder in
            let file = folder.appending(path: "submissions.json")
            try Data("[{\"submission\":".utf8).write(to: file)
            let loaded = SubmissionHistory.load(from: file)
            #expect(loaded.history.records.isEmpty)
            let aside = try #require(loaded.setAside)
            #expect(try Data(contentsOf: aside) == Data("[{\"submission\":".utf8))
        }
    }

    /// Two bad files in a row each keep their own copy.
    @Test func neverSetsAFileAsideOverAnother() throws {
        try inFolder { folder in
            let file = folder.appending(path: "submissions.json")
            try Data("first".utf8).write(to: file)
            let first = try #require(SubmissionHistory.load(from: file).setAside)
            try Data("second".utf8).write(to: file)
            let second = try #require(SubmissionHistory.load(from: file).setAside)
            #expect(first != second)
            #expect(try Data(contentsOf: first) == Data("first".utf8))
        }
    }

    @Test func namesTheChangedFilesAsTheDataFolderDoes() {
        #expect(record(1, .open).changedFiles == ["building-hours/1-1-cage.yaml"])
    }

    /// Launching again on the same bad file must not copy it once more each time.
    @Test func setsTheSameUnreadableFileAsideOnce() throws {
        try inFolder { folder in
            let file = folder.appending(path: "submissions.json")
            try Data("bad".utf8).write(to: file)
            let first = try #require(SubmissionHistory.load(from: file).setAside)
            let second = try #require(SubmissionHistory.load(from: file).setAside)
            #expect(first == second)
            let copies = try FileManager.default.contentsOfDirectory(atPath: folder.path(percentEncoded: false)).filter { $0.contains("unreadable") }
            #expect(copies.count == 1)
        }
    }

    @Test func savedDiffsReplaceTheLastAndForgetTheCheck() {
        var history = history(record(7, .open))
        history.take(files: [PullRequestFile(path: "data/building-hours/1-1-cage.yaml", rows: [.gap])], begun: .now, for: 7)
        history.saveDiffs(["building-hours/1-1-cage.yaml": [.line(DiffLine(kind: .added, text: "a"))]], saved: .now, for: 7)
        #expect(history.records[0].diffs == ["building-hours/1-1-cage.yaml": [.line(DiffLine(kind: .added, text: "a"))]])
        #expect(history.records[0].checked == nil)
    }

    /// A fetch that began before an update was sent would put back what GitHub showed before it.
    @Test func aFetchBegunBeforeASubmissionLeavesItsDiffs() {
        var history = history(record(7, .open))
        let sent: [String: [DiffRow]] = ["building-hours/1-1-cage.yaml": [.line(DiffLine(kind: .added, text: "sent"))]]
        history.saveDiffs(sent, saved: Date(timeIntervalSince1970: 2_000), for: 7)
        history.take(files: [PullRequestFile(path: "data/building-hours/1-1-cage.yaml", rows: [.gap])],
                     begun: Date(timeIntervalSince1970: 1_000), for: 7)
        #expect(history.records[0].diffs == sent)
        #expect(history.records[0].checked == nil)
    }

    @Test func aFetchNamesFilesAsTheWorkspaceDoesAndMarksTheTooLarge() {
        var history = history(record(7, .open))
        history.take(files: [PullRequestFile(path: "data/building-hours/2-1-big.yaml", rows: nil)], begun: .now, for: 7)
        #expect(history.records[0].diffs == ["building-hours/2-1-big.yaml": []])
        #expect(history.records[0].tooLarge == ["building-hours/2-1-big.yaml"])
        #expect(history.records[0].checked != nil)
    }

    /// Its files can no longer change, so one fetch after it finished is the last.
    @Test func aFinishedPullRequestIsFetchedOnceMore() {
        var history = history(record(7, .merged))
        #expect(history.records[0].needsFetch)
        history.take(files: [], begun: .now, for: 7)
        #expect(!history.records[0].needsFetch)
    }

    @Test func anOpenPullRequestKeepsBeingFetched() {
        var history = history(record(7, .open))
        history.take(files: [], begun: .now, for: 7)
        #expect(history.records[0].needsFetch)
    }

    @Test func savedDiffsSurviveSavingAndLoading() throws {
        try inFolder { folder in
            let file = folder.appending(path: "submissions.json")
            var saved = history(record(7, .merged))
            saved.take(files: [PullRequestFile(path: "data/building-hours/1-1-cage.yaml", rows: [.line(DiffLine(kind: .removed, text: "a")), .gap])],
                       begun: Date(timeIntervalSince1970: 1_800_000_000), for: 7)
            saved.save(to: file)
            let loaded = SubmissionHistory.load(from: file)
            #expect(loaded.history == saved)
            #expect(loaded.setAside == nil)
        }
    }

    /// A record without the fields this build writes cannot be read, so the file is kept aside.
    @Test func setsAsideARecordMissingItsFields() throws {
        try inFolder { folder in
            let file = folder.appending(path: "submissions.json")
            try Data(#"[{"submission":{"number":7,"url":"https://github.com/StoDevX/AAO-React-Native/pull/7","owner":"me","branch":"b","base":"c","paths":[]},"summary":"s","submitted":"2026-11-10T12:00:00Z"}]"#.utf8).write(to: file)
            let loaded = SubmissionHistory.load(from: file)
            #expect(loaded.history.records.isEmpty)
            #expect(loaded.setAside != nil)
        }
    }
}
