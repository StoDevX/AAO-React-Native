import DataEditorKit
import Foundation

/// A pull request the contributor submitted from this app, as the Activity section lists it.
struct SubmissionRecord: Codable, Hashable, Identifiable {
    var submission: Submission
    /// what the contributor wrote when they first submitted it, which is its title on GitHub
    let summary: String
    let submitted: Date
    /// what GitHub said of it at the last check; nil before the first check and after a failed one
    var state: SubmissionState?

    var id: Int { submission.number }

    /// Whether it takes no more commits, so its state no longer changes.
    var isFinished: Bool { state.map(AppModel.opensNewPullRequest(after:)) ?? false }

    /// The files it changed, as the workspace's `data/` folder names them.
    var changedFiles: [String] {
        submission.paths.map { $0.hasPrefix("data/") ? String($0.dropFirst("data/".count)) : $0 }
    }
}

/// Every pull request the contributor has submitted from this app, newest first.
struct SubmissionHistory: Equatable {
    private(set) var records: [SubmissionRecord] = []

    init() {}

    /// The records saved in `file`, or none when it is missing or unreadable.
    init(contentsOf file: URL) {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        records = (try? Data(contentsOf: file)).flatMap { try? decoder.decode([SubmissionRecord].self, from: $0) } ?? []
    }

    func save(to file: URL) {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        if let data = try? encoder.encode(records) { try? data.write(to: file) }
    }

    /// The pull request a new submission adds a commit to: the newest that is
    /// not merged or closed. A new one opens only after it is, so the older ones are.
    var current: SubmissionRecord? { records.first { !$0.isFinished } }

    /// The records whose state may yet change.
    var needingCheck: [SubmissionRecord] { records.filter { !$0.isFinished } }

    /// Adds a pull request just opened, as the newest.
    mutating func add(_ record: SubmissionRecord) { records.insert(record, at: 0) }

    /// Sets what GitHub said of pull request `number`, or nil when it could not tell.
    mutating func record(_ state: SubmissionState?, for number: Int) {
        guard let index = records.firstIndex(where: { $0.id == number }) else { return }
        records[index].state = state
    }

    /// Puts an updated submission, which may touch more paths, in place of the one it updated.
    mutating func replace(_ submission: Submission) {
        guard let index = records.firstIndex(where: { $0.id == submission.number }) else { return }
        records[index].submission = submission
    }

    mutating func forget(_ number: Int) { records.removeAll { $0.id == number } }
}
