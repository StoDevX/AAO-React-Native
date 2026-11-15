import AppKit
import DataEditorKit
import SwiftUI

/// A list of short names as tokens: type one and press Return to add it,
/// select one and press Delete to remove it. When the names come from
/// elsewhere in the file, those are offered as you type, and one that isn't
/// among them is named below.
struct TokenListField: View {
    let title: String
    let values: [String]
    /// the names the list may hold, or nil when any will do
    let choices: [String]?
    let identifier: String
    let change: ([String]) -> Void

    /// The edits from `old` to `new` at `path`: deletes and appends when the
    /// kept names stay in order, so a comment beside one stays with it, or
    /// else the whole list.
    static func ops(at path: [PathKey], from old: [String], to new: [String]) -> [EditOp] {
        guard old != new else { return [] }
        var removed: [Int] = []
        var matched = 0
        for (index, name) in old.enumerated() {
            if matched < new.count, new[matched] == name { matched += 1 } else { removed.append(index) }
        }
        let added = Array(new[matched...])
        let kept = old.count - removed.count
        // a name added that was there before has moved, which only the whole list says
        guard added.allSatisfy({ !old.contains($0) }) else { return [.set(path, .array(new.map(JSONValue.string)))] }
        return removed.reversed().map { .delete(path + [.index($0)]) }
            + added.enumerated().map { .set(path + [.index(kept + $0.offset)], .string($0.element)) }
    }

    var body: some View {
        let unlisted = choices.map { choices in values.filter { !choices.contains($0) } } ?? []
        LabeledContent(title) {
            VStack(alignment: .trailing, spacing: 4) {
                TokenField(tokens: values, choices: choices ?? []) { tokens in
                    if tokens != values { change(tokens) }
                }
                .accessibilityIdentifier(identifier)
                if !unlisted.isEmpty {
                    Text("Not listed in this file: \(unlisted.formatted(.list(type: .and).locale(Locale(identifier: "en_US"))))")
                        .font(.caption)
                        .foregroundStyle(.red)
                }
            }
        }
    }
}

/// AppKit's token field, whose tokens are plain strings.
private struct TokenField: NSViewRepresentable {
    let tokens: [String]
    let choices: [String]
    let commit: ([String]) -> Void

    func makeNSView(context: Context) -> NSTokenField {
        let field = NSTokenField()
        field.delegate = context.coordinator
        field.tokenStyle = .rounded
        field.completionDelay = 0
        field.setContentHuggingPriority(.defaultLow, for: .horizontal)
        return field
    }

    func updateNSView(_ field: NSTokenField, context: Context) {
        context.coordinator.parent = self
        // AppKit's field follows SwiftUI's `.disabled`, as a locked or updating file's must
        field.isEnabled = context.environment.isEnabled
        // the file's tokens, unless the contributor is typing
        if field.currentEditor() == nil { field.objectValue = tokens }
    }

    func makeCoordinator() -> Coordinator { Coordinator(parent: self) }

    final class Coordinator: NSObject, NSTokenFieldDelegate {
        var parent: TokenField
        init(parent: TokenField) { self.parent = parent }

        func tokenField(_ tokenField: NSTokenField, completionsForSubstring substring: String, indexOfToken tokenIndex: Int,
                        indexOfSelectedItem selectedIndex: UnsafeMutablePointer<Int>?) -> [Any]? {
            parent.choices.filter { $0.localizedCaseInsensitiveContains(substring) }
        }

        private func tokens(of field: NSTokenField) -> [String] {
            (field.objectValue as? [Any])?.compactMap { ($0 as? String)?.trimmingCharacters(in: .whitespaces) }
                .filter { !$0.isEmpty } ?? []
        }

        /// A token typed and turned into one by Return or a comma is saved then, not when the field is left.
        func tokenField(_ tokenField: NSTokenField, shouldAdd tokens: [Any], at index: Int) -> [Any] {
            // the field holds the new token once this returns
            DispatchQueue.main.async { [weak self, weak tokenField] in
                guard let self, let tokenField else { return }
                self.parent.commit(self.tokens(of: tokenField))
            }
            return tokens
        }

        func controlTextDidEndEditing(_ notification: Notification) {
            guard let field = notification.object as? NSTokenField else { return }
            parent.commit(tokens(of: field))
        }
    }
}
