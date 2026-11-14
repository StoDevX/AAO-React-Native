import DataEditorKit
import Foundation

/// The helper reports problems as the schema and the schedule checks word
/// them, for developers. These read them to a contributor: the messages the
/// editor can lead to in plain sentences, and the rest as they came.

/// What a field is called where a contributor reads about it.
private let fieldNames: [String: String] = [
    "title": "title", "notes": "note", "name": "name", "date": "date",
    "from": "opening time", "to": "closing time", "days": "days", "hours": "hours",
]

/// The last key of `path` that names a field, not a place in a list.
private func field(of path: [PathKey]?) -> String? {
    for key in (path ?? []).reversed() {
        if case .key(let name) = key { return name }
    }
    return nil
}

/// What a missing property or an empty list needs, by the field's key.
private let needs: [String: String] = [
    "title": "Needs a title.", "name": "Needs a name.", "date": "Needs a date.",
    "from": "Needs an opening time.", "to": "Needs a closing time.",
    "days": "Needs at least one day.", "hours": "Needs at least one row of hours.",
    "schedule": "Needs at least one schedule.",
]

/// A schema or schedule-check message as a sentence, or nil for one a contributor cannot reach.
private func plainMessage(_ message: String, path: [PathKey]?) -> String? {
    let name = field(of: path)
    if message == #"must match pattern "\S""# {
        return "The \(name.flatMap { fieldNames[$0] } ?? "text") can't be empty."
    }
    if message.hasPrefix(#"must match pattern "^"#), let name, name == "from" || name == "to" {
        return "The \(fieldNames[name]!) must be a time like 9:00am."
    }
    if message == #"must match format "date""# || message.hasPrefix(#"must match pattern "^"#) && name == "date" {
        return "The date must be a day like 2026-11-10."
    }
    if let match = message.wholeMatch(of: /must have required property '(\w+)'/) {
        return needs[String(match.1)]
    }
    if message == "must NOT have fewer than 1 items", let name {
        return needs[name]
    }
    if message.hasPrefix("must NOT have duplicate items"), name == "days" {
        return "Names the same day twice."
    }
    if message == "a schedule must contain at least one service" || message == "a replacement must contain at least one service" {
        return "Needs at least one schedule."
    }
    if let match = message.wholeMatch(of: /duplicate exception date (.+)/) {
        return "Another exception is already on \(match.1)."
    }
    if message == "break closure messages must not end with a period" {
        return "Take the period off the end of this note."
    }
    if let match = message.wholeMatch(of: /overlaps hours\[(\d+)\] on (.+)/), let row = Int(match.1) {
        let days = match.2.split(separator: ", ").map { dayNames[String($0)] ?? String($0) }
        return "Overlaps row \(row + 1) on \(spokenList(days))."
    }
    return nil
}

/// Each day as the files abbreviate it, in full.
private let dayNames: [String: String] = [
    "Mo": "Monday", "Tu": "Tuesday", "We": "Wednesday", "Th": "Thursday",
    "Fr": "Friday", "Sa": "Saturday", "Su": "Sunday",
]

/// `items` as a sentence lists them: "Friday, Saturday and Sunday".
private func spokenList(_ items: [String]) -> String {
    guard let last = items.last, items.count > 1 else { return items.first ?? "" }
    return items.dropLast().joined(separator: ", ") + " and " + last
}

/// The schema lets a service have no hours only if it is closed or has a
/// note, and reports `anyOf` with each way the service fell short of it.
private let noHoursReasons: Set<String> = [
    "must have required property 'isPhysicallyOpen'", "must have required property 'notes'",
]

/// `problems` as a contributor reads them: each message in plain words where
/// it can be, the reasons a service has no hours joined into one, and a
/// problem reported twice (by the file's check and the build's) listed once.
func plainProblems(_ problems: [Problem]) -> [Problem] {
    struct Place: Hashable { let file: String?; let path: [PathKey]? }
    let noHours = Set(problems.filter { $0.message == "must match a schema in anyOf" }.map { Place(file: $0.file, path: $0.path) })
    func isNoHoursReason(_ problem: Problem) -> Bool {
        guard let path = problem.path else { return false }
        if noHoursReasons.contains(problem.message) { return noHours.contains(Place(file: problem.file, path: path)) }
        if problem.message == "must NOT have fewer than 1 items", path.last == .key("hours") {
            return noHours.contains(Place(file: problem.file, path: Array(path.dropLast())))
        }
        return false
    }
    var seen = Set<Problem>()
    return problems.compactMap { problem in
        if isNoHoursReason(problem) { return nil }
        let message = problem.message == "must match a schema in anyOf" && noHours.contains(Place(file: problem.file, path: problem.path))
            ? "Has no hours. Add hours, turn on Closed, or add a note such as “By appointment”."
            : plainMessage(problem.message, path: problem.path) ?? problem.message
        let plain = Problem(file: problem.file, message: message, path: problem.path)
        return seen.insert(plain).inserted ? plain : nil
    }
}

/// Where `path` points in an hours file, as the editor's sections name it:
/// `Usual hours › schedule 1 › title`. `breakNames` names a break by its key.
func plainPlace(_ path: [PathKey], breakNames: [String: String] = [:]) -> String {
    var words: [String] = []
    var keys = path[...]
    // the list the next index counts in
    var counting = "#"
    while let key = keys.popFirst() {
        switch key {
        case .key("schedule") where words.isEmpty:
            words.append("Usual hours")
            counting = "schedule"
        case .key("schedule"):
            counting = "schedule"
        case .key("exceptions") where words.isEmpty:
            if case .index(let index)? = keys.first {
                keys.removeFirst()
                words.append("Exception \(index + 1)")
            } else {
                words.append("Exceptions")
            }
        case .key("breakSchedule") where words.isEmpty:
            if case .key(let name)? = keys.first {
                keys.removeFirst()
                words.append(breakNames[name] ?? name)
                counting = "schedule"
            } else {
                words.append("Breaks")
            }
        case .key("hours"):
            counting = "row"
        case .key(let name):
            words.append(fieldNames[name] ?? name)
        case .index(let index):
            words.append(counting == "#" ? "#\(index + 1)" : "\(counting) \(index + 1)")
            counting = "#"
        }
    }
    return words.joined(separator: " › ")
}

/// What a contributor calls `file`: the record it holds, in a set with a file
/// per record; the set it holds, for a file of many records or one record
/// (FAQs & Notices); or else its path, for a file no listed set holds.
func recordName(of file: String, catalog: DataSetCatalog?, records: [String: [RecordSummary]]) -> String {
    guard let set = catalog?.set(for: file), let dataSet = catalog?.sets[set] else { return file }
    if dataSet.shape == .folder { return records[set]?.first { $0.ref.file == file }?.title ?? file }
    return dataSet.title
}

/// A problem's line: its message, after the record it belongs to when that
/// is not the file on screen, so a problem the check found in another file
/// does not send the contributor to the wrong one. `name` names a file.
func problemLine(_ problem: Problem, fileOnScreen: String?, name: (String) -> String) -> String {
    guard let file = problem.file, file != fileOnScreen else { return problem.message }
    return "\(name(file)): \(problem.message)"
}
