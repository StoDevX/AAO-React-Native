import DataEditorKit
import SwiftUI

/// Text typed into a document that would not save, and what the file held
/// when it was typed, which a save of it must still find there.
struct KeptDocument: Equatable {
    let text: String
    let readAs: String
}

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

    /// Writes what is typed over the file as it is now, once the contributor
    /// has chosen to, after a save was refused because the file changed.
    private func saveOverNewer() async {
        guard let current = await model.readText(file) else { return }
        saved = current
        await save()
    }

    var body: some View {
        HSplitView {
            VStack(alignment: .leading) {
                TextEditor(text: $text)
                    .font(.body.monospaced())
                    .accessibilityIdentifier("document-text")
                HStack {
                    if saveFailed {
                        Label("Not saved: \(model.name(of: file)) changed since you opened it", systemImage: "exclamationmark.triangle.fill")
                        Button("Save Over It") { Task { await saveOverNewer() } }
                    }
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
            // text that would not save when the editor last closed comes back, unsaved,
            // against what it was typed over, so a save still finds the file changed
            let kept = model.takeKeptDocument(file)
            text = kept?.text ?? read
            saved = kept?.readAs ?? read
            saveFailed = kept.map { $0.readAs != read } ?? false
        }
        // what is typed is saved before Submit, quitting or choosing elsewhere, as a text field's draft is
        .onAppear { model.registerDraftSaver(id) { await save() } }
        .onChange(of: text != saved) { _, unsaved in model.noteDraft(id, unsaved: unsaved && saved != nil) }
        .onDisappear {
            if let saved { Task { [file, text] in await model.leaveDocument(file, text: text, expected: saved) } }
            model.noteDraft(id, unsaved: false)
            model.unregisterDraftSaver(id)
        }
    }
}
