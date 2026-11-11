import DataEditorKit
import Foundation

/// A changeset, which names its window: the edits in hand, or a pull request already submitted.
enum Changeset: Hashable, Codable {
    case current
    case pullRequest(number: Int)
}

/// What a changeset's window shows: its Overview or one of its buildings.
enum ChangesetItem: Hashable {
    case overview
    case building(file: String)
}

/// The Overview's line about the phone preview.
enum PreviewLine: Equatable {
    case upToDate
    /// the build stopped at this file, whose problems the Overview lists
    case stopsAt(file: String)
    /// the build did not run at all
    case failed

    /// - Parameter buildings: names the file that stops the build, when it is listed
    func text(buildings: [BuildingSummary]) -> String {
        switch self {
        case .upToDate: "The preview is up to date"
        case .stopsAt(let file): "The preview stops at \(buildings.first { $0.file == file }?.name ?? file)"
        case .failed: "The preview couldn't be updated"
        }
    }
}

/// What the Overview of Current changes shows, in order. Each part is there only when it applies.
struct OverviewParts: Equatable {
    /// the pull request a new submission updates, or the newest if it has finished
    var pullRequest: SubmissionRecord?
    var newerData: Bool
    var conflicts: [String]
    /// nil before the first build
    var preview: PreviewLine?
    var problems: [Problem]
    var changed: [String]

    /// The files with a problem, which the building list marks.
    var problemFiles: Set<String> { Set(problems.compactMap(\.file)) }

    /// Whether "No changes" stands in for the conflicts and the changed files.
    /// A conflict is a change: the contributor still has to choose.
    var isEmpty: Bool { conflicts.isEmpty && changed.isEmpty }

    /// - Parameters:
    ///   - checkProblems: what the last load or edit's check found, in every file: it walks the whole schedule graph
    ///   - buildProblems: what the last build found
    static func make(history: SubmissionHistory, newerCommit: String?, conflicts: [String], changedFiles: [String],
                     checkProblems: [Problem], buildProblems: [Problem], hasBuilt: Bool) -> OverviewParts {
        // a finished one stays until a new one opens, so its Merged and Get the Latest Data show
        let pullRequest = history.current ?? history.records.first
        // a failed check builds nothing, so its problems come here themselves; each once
        var seen = Set<Problem>()
        let problems = (checkProblems + buildProblems).filter { seen.insert($0).inserted }
        // any problem stops the build, so the phone keeps the last good one, without the newest edits
        let preview: PreviewLine? = if let first = problems.first {
            first.file.map { .stopsAt(file: $0) } ?? .failed
        } else if hasBuilt {
            .upToDate
        } else {
            nil
        }
        return OverviewParts(pullRequest: pullRequest, newerData: newerCommit != nil, conflicts: conflicts, preview: preview,
                             problems: problems, changed: changedFiles)
    }
}

/// The buildings the second column lists for `changeset`: every one for
/// Current changes; for a pull request, the files it changed, each named as
/// the data names it, or by its file name when the data no longer lists it.
func changesetBuildings(_ changeset: Changeset, all: [BuildingSummary], history: SubmissionHistory) -> [BuildingSummary] {
    guard case .pullRequest(let number) = changeset else { return all }
    let files = history.records.first { $0.id == number }?.changedFiles ?? []
    return files.map { file in
        all.first { $0.file == file } ?? BuildingSummary(file: file, name: (file as NSString).lastPathComponent, category: "")
    }
}
