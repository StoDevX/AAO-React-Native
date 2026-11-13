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

    private func save() {
        guard let saved, text != saved else { return }
        let typed = text
        Task {
            saveFailed = !(await model.writeText(file, typed))
            if !saveFailed { self.saved = typed }
        }
    }

    var body: some View {
        HSplitView {
            VStack(alignment: .leading) {
                TextEditor(text: $text)
                    .font(.body.monospaced())
                    .accessibilityIdentifier("document-text")
                HStack {
                    if saveFailed { Label("Not saved", systemImage: "exclamationmark.triangle.fill") }
                    Spacer()
                    Button("Save", action: save)
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
        // what is typed is saved when the editor goes, as a text field's draft is
        .onDisappear(perform: save)
    }
}
