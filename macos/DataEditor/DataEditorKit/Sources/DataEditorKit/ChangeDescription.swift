/// What changed in one building's hours file, in plain words, one change a
/// line: what the on-device model phrases as a pull request's title. Its
/// schedules, then its exceptions by date, its breaks, and anything else.
public func describeChange(from before: HoursDocument?, to after: HoursDocument) -> [String] {
    guard let before else { return ["New building: \(summary(after.services))"] }
    var lines: [String] = []
    if before.name != after.name { lines.append("Renamed to \(after.name)") }
    lines += describeServices(from: before.services, to: after.services, scope: "")
    lines += describeExceptions(from: before.exceptions, to: after.exceptions)
    lines += describeBreaks(from: before.breakSchedule, to: after.breakSchedule)
    lines += otherFields(before.value, after.value).map { "Changed its \($0)" }
    return lines
}

/// The fields this description covers in its own words.
private let describedFields: Set<String> = ["name", "schedule", "exceptions", "breakSchedule"]

/// The top-level fields, other than those described, whose values differ.
private func otherFields(_ before: JSONValue, _ after: JSONValue) -> [String] {
    guard case .object(let old) = before, case .object(let new) = after else { return [] }
    return Set(old.keys).union(new.keys).subtracting(describedFields).sorted().filter { old[$0] != new[$0] }
}

/// Each service compared with the one at its place, named by its new title.
/// `scope` follows the name, as in " on 2026-12-24".
private func describeServices(from before: [Service], to after: [Service], scope: String) -> [String] {
    (0..<max(before.count, after.count)).flatMap { index -> [String] in
        let old = before.indices.contains(index) ? before[index] : nil
        let new = after.indices.contains(index) ? after[index] : nil
        guard let new else { return old.map { ["\($0.title)\(scope) removed"] } ?? [] }
        guard let old else { return ["\(new.title)\(scope) added: \(hours(new))"] }
        var lines: [String] = []
        if old.title != new.title { lines.append("\(old.title)\(scope) renamed to \(new.title)") }
        // the closed days come first: the model titles the first change it reads
        let closed = Set(old.rows.flatMap(\.days)).subtracting(new.rows.flatMap(\.days))
        if !closed.isEmpty, !new.rows.isEmpty { lines.append("\(new.title)\(scope): no longer open \(days(Array(closed)))") }
        if hours(old) != hours(new) { lines.append("\(new.title)\(scope): \(hours(old)) → \(hours(new))") }
        switch (old.notes, new.notes) {
        case (nil, let added?): lines.append("\(new.title)\(scope): note added: \"\(added)\"")
        case (_?, nil): lines.append("\(new.title)\(scope): note removed")
        case (let was?, let now?) where was != now: lines.append("\(new.title)\(scope): note changed to \"\(now)\"")
        default: break
        }
        return lines
    }
}

private func describeExceptions(from before: [(date: String, services: [Service])],
                                to after: [(date: String, services: [Service])]) -> [String] {
    let old = Dictionary(before.map { ($0.date, $0.services) }) { first, _ in first }
    let new = Dictionary(after.map { ($0.date, $0.services) }) { first, _ in first }
    return Set(old.keys).union(new.keys).sorted().flatMap { date -> [String] in
        switch (old[date], new[date]) {
        case (nil, let added?): ["Added an exception on \(date): \(summary(added))"]
        case (_?, nil): ["Removed the exception on \(date)"]
        case (let was?, let now?): describeServices(from: was, to: now, scope: " on \(date)")
        default: []
        }
    }
}

private func describeBreaks(from before: [String: HoursDocument.BreakEntry],
                            to after: [String: HoursDocument.BreakEntry]) -> [String] {
    Set(before.keys).union(after.keys).sorted().compactMap { key -> String? in
        switch (before[key], after[key]) {
        case (nil, let added?): "During \(key): \(entry(added))"
        case (_?, nil): "During \(key): no longer set"
        case (let was?, let now?) where was != now: "During \(key): \(entry(was)) → \(entry(now))"
        default: nil
        }
    }
}

private func entry(_ entry: HoursDocument.BreakEntry) -> String {
    switch entry {
    case .template(let name): "the \(name) template"
    case .custom(let services): summary(services)
    case .other: "its own schedule with exceptions"
    }
}

/// Every service by its title and hours, as in "Hours Mon–Fri 9am–5pm".
private func summary(_ services: [Service]) -> String {
    services.map { "\($0.title) \(hours($0))" }.joined(separator: "; ")
}

/// A service's rows, as in "Mon–Fri 7:30am–8pm; Sat–Sun 9am–8pm", or "closed".
private func hours(_ service: Service) -> String {
    service.rows.isEmpty ? "closed" : service.rows.map { "\(days($0.days)) \(time($0.fromText))–\(time($0.toText))" }.joined(separator: "; ")
}

/// Days in week order, a run of two or more written as its ends: "Mon–Wed, Fri".
private func days(_ days: [Weekday]) -> String {
    let indices = Set(days.compactMap { Weekday.allCases.firstIndex(of: $0) }).sorted()
    var runs: [[Int]] = []
    for index in indices {
        if let last = runs.last?.last, last + 1 == index { runs[runs.count - 1].append(index) } else { runs.append([index]) }
    }
    return runs.map { run in
        let first = Weekday.allCases[run[0]].label
        return run.count == 1 ? first : "\(first)–\(Weekday.allCases[run[run.count - 1]].label)"
    }.joined(separator: ", ")
}

/// "7:30am", or "9am" on the hour; text that is not a time as it is written.
private func time(_ text: String) -> String {
    guard let time = ClockTime(text) else { return text }
    return time.minutes % 60 == 0 ? time.text.replacingOccurrences(of: ":00", with: "") : time.text
}
