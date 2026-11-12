import DataEditorKit
import Foundation
import FoundationModels

/// A file the changeset changes, by the building it holds and its diff.
struct ChangedFile {
    let building: String
    let diff: [DiffLine]
}

/// What the on-device model reads to suggest a summary: each building, then
/// the lines its file gained (`+`) and lost (`-`). Stops before `limit`
/// characters, between lines, since the model reads a few thousand words at most.
func summaryPrompt(_ files: [ChangedFile], limit: Int = 6000) -> String {
    var prompt = ""
    func add(_ line: String) -> Bool {
        let next = prompt.isEmpty ? line : prompt + "\n" + line
        guard next.count <= limit else { return false }
        prompt = next
        return true
    }
    for (index, file) in files.enumerated() {
        if index > 0, !add("") { break }
        guard add("\(file.building):") else { break }
        for line in file.diff where line.kind != .same {
            let mark = line.kind == .added ? "+" : "-"
            guard add("\(mark) \(line.text.trimmingCharacters(in: .whitespaces))") else { return prompt }
        }
    }
    return prompt
}

/// The model's reply as a summary: its first line, without the quotes or the
/// full stop a pull request's title leaves off.
func cleanSuggestion(_ reply: String) -> String {
    let line = reply.split(whereSeparator: \.isNewline)
        .map { $0.trimmingCharacters(in: .whitespaces) }
        .first { !$0.isEmpty } ?? ""
    var summary = line.trimmingCharacters(in: CharacterSet(charactersIn: "\"“”'"))
    // "9 p.m." ends on its abbreviation's full stop, not a sentence's
    if summary.hasSuffix("."), summary.firstMatch(of: /\.\p{L}\.$/) == nil { summary.removeLast() }
    return summary
}

/// What the submit sheet offers for suggesting a summary on this Mac now.
var suggestionOffer: SuggestionOffer { SuggestionOffer(SystemLanguageModel.default.availability) }

/// A summary of `files` from the on-device model, for the contributor to edit.
func suggestSummary(for files: [ChangedFile]) async throws -> String {
    let session = LanguageModelSession(instructions: """
        You title changes to a college's building hours. Reply with one short \
        line in the imperative, under 70 characters, with no full stop, like \
        "Close The Cage at 9 p.m. on Fridays" or "Add brunch hours to Stav Hall". \
        Name the building and what changed, in plain words. When more than \
        one building changed, name each one.
        """)
    // the small model drops all but the first building unless told them up front
    let buildings = "Buildings changed: " + files.map(\.building).joined(separator: ", ")
    return cleanSuggestion(try await session.respond(to: buildings + "\n\n" + summaryPrompt(files)).content)
}
