import Foundation

public struct DiffLine: Hashable, Codable, Sendable {
    public enum Kind: String, Codable, Sendable { case same, added, removed }
    public let kind: Kind
    public let text: String

    public init(kind: Kind, text: String) {
        self.kind = kind
        self.text = text
    }
}

/// `new` against `old`, line by line, with each removal shown just before what replaced it.
public func lineDiff(old: String, new: String) -> [DiffLine] {
    // An empty text has no lines, where splitting it would give one blank line.
    let split = { (text: String) in text.isEmpty ? [] : text.split(separator: "\n", omittingEmptySubsequences: false).map(String.init).dropLast(text.hasSuffix("\n") ? 1 : 0) }
    let a = Array(split(old)), b = Array(split(new))
    let difference = b.difference(from: a)
    var removed = Set<Int>(), inserted = Set<Int>()
    for change in difference {
        switch change {
        case .remove(let offset, _, _): removed.insert(offset)
        case .insert(let offset, _, _): inserted.insert(offset)
        }
    }
    var lines: [DiffLine] = []
    var i = 0, j = 0
    while i < a.count || j < b.count {
        if i < a.count, removed.contains(i) { lines.append(DiffLine(kind: .removed, text: a[i])); i += 1 }
        else if j < b.count, inserted.contains(j) { lines.append(DiffLine(kind: .added, text: b[j])); j += 1 }
        else { lines.append(DiffLine(kind: .same, text: b[j])); i += 1; j += 1 }
    }
    return lines
}
