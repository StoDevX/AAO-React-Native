import DataEditorKit
import SwiftUI

/// A prose document, such as the privacy policy: its markdown, and beside it how it reads.
struct DocumentEditorView: View {
    @Environment(AppModel.self) private var model
    let file: String
    @State private var text = ""
    /// What the file held when last read or saved; the text is unsaved while it differs.
    @State private var saved: String?
    @State private var saveFailed = false
    @State private var id = UUID()

    /// Writes what is typed, if it differs from the file, and reports whether
    /// nothing is left unsaved. The write is refused if the file changed since
    /// it was read, as an update or a revert changes it, and the text stays.
    @discardableResult
    private func save() async -> Bool {
        guard let saved, text != saved else { return true }
        let typed = text
        let wrote = await model.writeText(file, typed, expected: saved)
        saveFailed = !wrote
        if wrote { self.saved = typed }
        return wrote
    }

    var body: some View {
        HSplitView {
            VStack(alignment: .leading) {
                TextEditor(text: $text)
                    .font(.body.monospaced())
                    .accessibilityIdentifier("document-text")
                HStack {
                    if saveFailed { Label("Not saved: the policy changed since you opened it", systemImage: "exclamationmark.triangle.fill") }
                    Spacer()
                    Button("Save") { Task { await save() } }
                        .keyboardShortcut("s")
                        .disabled(saved == nil || text == saved)
                }
            }
            .padding()
            ScrollView {
                Text((try? AttributedString(markdown: text, options: .init(interpretedSyntax: .inlineOnlyPreservingWhitespace))) ?? AttributedString(text))
                    .textSelection(.enabled)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
            }
        }
        .task(id: file) {
            let read = await model.readText(file) ?? ""
            text = read
            saved = read
        }
        // what is typed is saved before Submit, quitting or choosing elsewhere, as a text field's draft is
        .onAppear { model.registerDraftSaver(id) { await save() } }
        .onChange(of: text != saved) { _, unsaved in model.noteDraft(id, unsaved: unsaved && saved != nil) }
        .onDisappear {
            Task { await save() }
            model.noteDraft(id, unsaved: false)
            model.unregisterDraftSaver(id)
        }
    }
}
