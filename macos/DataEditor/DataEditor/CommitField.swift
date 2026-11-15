import DataEditorKit
import SwiftUI

/// A text field saved when the contributor presses Return or leaves it, not
/// at each keystroke. `save` says, once the save is done, whether it took what
/// was typed; when it doesn't, or nothing changed, the field shows `text` again.
struct CommitField: View {
    let label: String
    let text: String
    let identifier: String
    /// where the field's value is in the file, so it can take focus when something is added there
    var place: [PathKey]? = nil
    let save: (String) async -> Bool
    @State private var draft = ""
    @FocusState private var focused: Bool

    private func commit() {
        let typed = draft.trimmingCharacters(in: .whitespaces)
        guard typed != text else { draft = text; return }
        // a save refused, as one beside another edit is, shows the file's text again rather than seeming saved
        Task { if await !save(typed), draft == typed { draft = text } }
    }

    var body: some View {
        TextField(label, text: $draft, prompt: Text(label))
            .textFieldStyle(.roundedBorder)
            .labelsHidden()
            .multilineTextAlignment(.leading)
            .focused($focused)
            .onSubmit(commit)
            .onChange(of: focused) { _, isFocused in if !isFocused { commit() } }
            .onAppear { draft = text }
            // the file's text, unless typing since has moved past it: a save landing
            // after more was typed must not take back what was typed
            .onChange(of: text) { old, saved in if draft == old || draft == saved { draft = saved } }
            .focusedWhenAdded(at: place, $focused)
            .accessibilityIdentifier(identifier)
    }
}

/// Focuses a field when it is the first drawn where something was just added.
private struct FocusedWhenAdded: ViewModifier {
    @Environment(AppModel.self) private var model
    let place: [PathKey]?
    let focused: FocusState<Bool>.Binding

    private func claim() {
        guard let place, let request = model.focusRequest, place.starts(with: request) else { return }
        model.focusRequest = nil
        // once the field is in the window, which it is not yet as it appears
        Task { focused.wrappedValue = true }
    }

    func body(content: Content) -> some View {
        content
            .onAppear(perform: claim)
            .onChange(of: model.focusRequest) { claim() }
    }
}

extension View {
    /// Focuses this field, at `place` in the file, when it is the first drawn where something was just added.
    func focusedWhenAdded(at place: [PathKey]?, _ focused: FocusState<Bool>.Binding) -> some View {
        modifier(FocusedWhenAdded(place: place, focused: focused))
    }
}

/// A place as its latitude and longitude, side by side, written `[lat, long]`.
struct CoordinateField: View {
    let title: String
    let value: JSONValue?
    let identifier: String
    /// sets the coordinate at an index, 0 for latitude and 1 for longitude
    let set: (Int, Double) -> Void

    private var numbers: [JSONValue] {
        let held = value?.array ?? []
        return (0..<2).map { held.indices.contains($0) ? held[$0] : .number(0) }
    }

    /// Saves `typed` as the number at `index`, unless it isn't one.
    private func save(_ typed: String, at index: Int) -> Bool {
        guard let number = Double(typed), number.isFinite else { return false }
        set(index, number)
        return true
    }

    var body: some View {
        let numbers = numbers
        LabeledContent(title) {
            HStack {
                CommitField(label: "Latitude", text: numbers[0].fieldText, identifier: identifier + "-latitude") { save($0, at: 0) }
                    .help("Latitude")
                CommitField(label: "Longitude", text: numbers[1].fieldText, identifier: identifier + "-longitude") { save($0, at: 1) }
                    .help("Longitude")
            }
        }
    }
}
