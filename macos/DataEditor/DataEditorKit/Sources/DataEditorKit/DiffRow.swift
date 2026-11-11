import Foundation

/// A row of a file's diff: a line, or the unchanged lines left out between two changes.
public enum DiffRow: Hashable, Codable, Sendable {
    case line(DiffLine)
    case gap
}

/// The changed lines of a diff with up to `context` unchanged lines around
/// each, so a reader can tell which schedule a line belongs to. Three, as
/// GitHub's patches have, so a saved diff and a fetched one read alike.
public func diffRows(_ lines: [DiffLine], context: Int = 3) -> [DiffRow] {
    var kept = Set<Int>()
    for index in lines.indices where lines[index].kind != .same {
        kept.formUnion(max(0, index - context)...min(lines.count - 1, index + context))
    }
    var rows: [DiffRow] = []
    var previous: Int?
    for index in kept.sorted() {
        if let previous, index > previous + 1 { rows.append(.gap) }
        rows.append(.line(lines[index]))
        previous = index
    }
    return rows
}

/// The rows of a unified diff's hunks, as GitHub sends a file's `patch`: a
/// gap between two hunks, and no row for a hunk header or for the marker
/// that the file has no final newline.
public func parsePatch(_ patch: String) -> [DiffRow] {
    var rows: [DiffRow] = []
    var seenHunk = false
    for line in patch.split(separator: "\n", omittingEmptySubsequences: false) {
        if line.hasPrefix("@@") {
            if seenHunk { rows.append(.gap) }
            seenHunk = true
            continue
        }
        guard seenHunk, let first = line.first else { continue }
        let text = String(line.dropFirst())
        switch first {
        case "+": rows.append(.line(DiffLine(kind: .added, text: text)))
        case "-": rows.append(.line(DiffLine(kind: .removed, text: text)))
        case " ": rows.append(.line(DiffLine(kind: .same, text: text)))
        // the marker that a side has no final newline, `\ No newline at end of file`
        default: continue
        }
    }
    return rows
}
