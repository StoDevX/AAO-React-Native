import CryptoKit
import DataEditorKit
import Foundation

/// A pull request the contributor submitted from this app, as the Activity section lists it.
struct SubmissionRecord: Codable, Hashable, Identifiable {
    var submission: Submission
    /// what the contributor wrote when they first submitted it, which is its title on GitHub
    let summary: String
    let submitted: Date
    /// what GitHub last said of it; nil until GitHub first answers
    var state: SubmissionState?
    /// Each changed file's diff, by its name in the workspace's `data/`
    /// folder: what was sent, or what GitHub last showed. Nil until saved.
    var diffs: [String: [DiffRow]]?
    /// The files GitHub sent no patch for, as it does for one too large to show
    var tooLarge: Set<String> = []
    /// When GitHub last sent `diffs`; nil while they are the copy saved at submission
    var checked: Date?
    /// Whether `diffs` came from GitHub after the pull request finished, so they cannot change again
    var isFinal = false
    /// When `diffs` were last saved at a submission, so a fetch begun before then cannot put back older ones
    var savedAt: Date?

    var id: Int { submission.number }

    /// Whether GitHub may show different diffs from the ones kept.
    var needsFetch: Bool { !isFinal }

    /// Whether it takes no more commits, so its state no longer changes.
    var isFinished: Bool { state?.isFinished ?? false }

    /// The files it changed, as the workspace's `data/` folder names them.
    var changedFiles: [String] { submission.paths.map(Self.dataFile) }

    /// A repository path as the workspace's `data/` folder names it.
    static func dataFile(_ path: String) -> String {
        path.hasPrefix("data/") ? String(path.dropFirst("data/".count)) : path
    }
}

/// The pull requests whose last check GitHub did not answer. Kept in memory
/// only: a failed check leaves each record's state as GitHub last said it.
struct CheckFailures: Equatable {
    /// the pull requests whose last check failed
    private(set) var unanswered: Set<Int> = []
    /// those GitHub said no longer exist, which alone may be forgotten (see `isUnreadable`)
    private(set) var gone: Set<Int> = []

    /// Whether GitHub refuses to show a pull request for good: it was
    /// deleted. A rate limit is not that: the pull request is still there, and
    /// forgetting it would let the next submission open a duplicate.
    static func isUnreadable(_ error: any Error) -> Bool {
        (error as? SubmitError)?.isGone == true
    }

    mutating func clear(_ number: Int) {
        unanswered.remove(number)
        gone.remove(number)
    }

    /// Notes a failed check of `number`. Only this check says whether it is
    /// gone: a rate limit after a 404 says nothing either way, and forgetting
    /// one still there would let the next submission open a second.
    mutating func noteFailure(of number: Int, gone isGone: Bool) {
        unanswered.insert(number)
        if isGone { gone.insert(number) } else { gone.remove(number) }
    }
}

/// Every pull request the contributor has submitted from this app, newest first.
struct SubmissionHistory: Equatable {
    private(set) var records: [SubmissionRecord] = []

    /// A record as it decodes, or nil for one this build cannot read.
    private struct Readable: Decodable {
        let record: SubmissionRecord?
        init(from decoder: any Decoder) throws { record = try? SubmissionRecord(from: decoder) }
    }

    /// The records saved in `file`, none when it is missing. A file holding a
    /// record this build cannot read, or that cannot be read at all, gives
    /// the records it can and is copied to `setAside` first, so saving the
    /// history over it loses nothing for good.
    static func load(from file: URL) -> (history: SubmissionHistory, setAside: URL?) {
        guard let data = try? Data(contentsOf: file) else { return (SubmissionHistory(), nil) }
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let readable = (try? decoder.decode([Readable].self, from: data))?.map(\.record)
        var history = SubmissionHistory()
        history.records = readable?.compactMap { $0 } ?? []
        let readEveryRecord = readable.map { !$0.contains { $0 == nil } } ?? false
        if readEveryRecord { return (history, nil) }
        // named by its contents, so loading the same file again finds its copy rather than making another
        let digest = SHA256.hash(data: data).prefix(8).map { String(format: "%02x", $0) }.joined()
        let aside = file.deletingLastPathComponent()
            .appending(path: "\(file.deletingPathExtension().lastPathComponent)-unreadable-\(digest).json")
        if FileManager.default.fileExists(atPath: aside.path(percentEncoded: false)) { return (history, aside) }
        // without the copy, the next save would lose the unread records for good
        guard (try? data.write(to: aside, options: .withoutOverwriting)) != nil else { return (history, nil) }
        return (history, aside)
    }

    /// Writes the records to `file` whole, or not at all, so a crash cannot leave half a file.
    func save(to file: URL) {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        if let data = try? encoder.encode(records) { try? data.write(to: file, options: .atomic) }
    }

    /// The pull request a new submission adds a commit to: the newest that is
    /// not merged or closed. A new one opens only after it is, so the older ones are.
    var current: SubmissionRecord? { records.first { !$0.isFinished } }

    /// The records whose state may yet change.
    var needingCheck: [SubmissionRecord] { records.filter { !$0.isFinished } }

    /// Adds a pull request just opened, as the newest.
    mutating func add(_ record: SubmissionRecord) { records.insert(record, at: 0) }

    /// Takes what a check of pull request `number` found. GitHub's answer
    /// replaces its state and clears its failures; a failed check leaves the
    /// state as GitHub last said it and is noted in `failures`.
    mutating func take(_ result: Result<SubmissionState, any Error>, for number: Int, failures: inout CheckFailures) {
        guard let index = records.firstIndex(where: { $0.id == number }) else { return }
        switch result {
        case .success(let state):
            records[index].state = state
            failures.clear(number)
        case .failure(let error):
            failures.noteFailure(of: number, gone: CheckFailures.isUnreadable(error))
        }
    }

    /// Puts an updated submission, which may touch more paths, in place of the one it updated.
    mutating func replace(_ submission: Submission) {
        guard let index = records.firstIndex(where: { $0.id == submission.number }) else { return }
        records[index].submission = submission
    }

    mutating func forget(_ number: Int) { records.removeAll { $0.id == number } }

    /// Keeps `diffs`, what pull request `number` was sent at `saved`, in
    /// place of whatever was kept before; GitHub has not shown them yet.
    mutating func saveDiffs(_ diffs: [String: [DiffRow]], saved: Date, for number: Int) {
        guard let index = records.firstIndex(where: { $0.id == number }) else { return }
        records[index].diffs = diffs
        records[index].savedAt = saved
        records[index].tooLarge = []
        records[index].checked = nil
    }

    /// Keeps the files GitHub showed for pull request `number`, asked at
    /// `begun`. Once it has finished, these are its last. A fetch begun
    /// before the last submission saved its diffs shows less than they do, so it is dropped.
    mutating func take(files: [PullRequestFile], begun: Date, for number: Int) {
        guard let index = records.firstIndex(where: { $0.id == number }) else { return }
        if let saved = records[index].savedAt, saved > begun { return }
        var diffs: [String: [DiffRow]] = [:]
        var tooLarge: Set<String> = []
        for file in files {
            let name = SubmissionRecord.dataFile(file.path)
            diffs[name] = file.rows ?? []
            if file.rows == nil { tooLarge.insert(name) }
        }
        records[index].diffs = diffs
        records[index].tooLarge = tooLarge
        records[index].checked = begun
        records[index].isFinal = records[index].isFinished
    }
}
