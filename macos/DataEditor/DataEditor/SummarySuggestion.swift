import DataEditorKit
import Foundation
import FoundationModels

/// A building the changeset changes, with what changed in it, in words.
struct ChangedFile {
    let building: String
    let changes: [String]
}

/// What the on-device model reads about one building: what changed in it,
/// a line each. Stops before `limit` characters, between lines, since the
/// model reads a few thousand words at most.
func summaryPrompt(_ file: ChangedFile, limit: Int = 6000) -> String {
    var prompt = ""
    for change in file.changes {
        let next = prompt.isEmpty ? "- \(change)" : prompt + "\n- \(change)"
        guard next.count <= limit else { break }
        prompt = next
    }
    return prompt
}

/// A summary from what changed at each building, as in "Close on weekends at
/// The Cage". The app names the buildings: the model dropped the second one
/// and named the first twice.
func summary(of phrases: [(building: String, phrase: String)]) -> String {
    phrases.filter { !$0.phrase.isEmpty }.map { "\($0.phrase) at \($0.building)" }.joined(separator: "; ")
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

/// What the on-device model reads before each building's changes. An example
/// naming a building in the data was copied word for word, so the examples
/// pair changes with replies and name none. Tuned on the Mac's own model
/// against a weekday-only change, a later Friday, a new brunch, a holiday
/// and two buildings at once.
private let instructions = """
    You describe a change to one building's hours in a few words. The user lists what changed, as "old → new"; \
    each line starts with the schedule it is in. Reply with one imperative phrase, under 40 characters, no full \
    stop, that does not name the building. Name the schedule when it is not "Hours". Use only days and times that \
    appear in the changes; never invent one. When days are no longer open, say they close. Leave out notes.

    Changes: Grill: Mon–Fri 11am–2pm → Mon–Fri 11am–3pm
    Reply: Keep the grill open until 3pm on weekdays

    Changes: Brunch added: Sun 10am–1pm
    Reply: Add Sunday brunch

    Changes: Added an exception on 2026-12-24: Hours closed
    Reply: Close on 2026-12-24

    Changes: Hours: Mon–Sun 8am–6pm → Mon–Fri 8am–6pm
    Hours: no longer open Sat–Sun
    Reply: Close on weekends
    """

/// A summary of `files` from the on-device model, for the contributor to edit:
/// one phrase for each building, asked about on its own.
func suggestSummary(for files: [ChangedFile]) async throws -> String {
    var phrases: [(building: String, phrase: String)] = []
    for file in files where !file.changes.isEmpty {
        let session = LanguageModelSession(instructions: instructions)
        phrases.append((file.building, cleanSuggestion(try await session.respond(to: summaryPrompt(file)).content)))
    }
    return summary(of: phrases)
}
