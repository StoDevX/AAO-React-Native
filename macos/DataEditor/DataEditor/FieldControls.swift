import DataEditorKit
import SwiftUI

/// A form's fields for the object at `base` in `file`, each drawn by its kind.
struct FieldRows: View {
    let fields: [FormField]
    /// where the object these fields belong to is in the file
    let base: [PathKey]
    /// that object, as the file holds it
    let value: JSONValue?
    let file: String
    /// where the record is, so a field's accessibility identifier names its place in the record
    let recordPath: [PathKey]

    var body: some View {
        ForEach(fields) { field in
            FieldRow(field: field, base: base, value: value?[field.key], parent: value, file: file, recordPath: recordPath)
        }
    }
}

/// `path` below the record, as a field's accessibility identifier names it: `field-ST.1`.
private func identifier(_ path: [PathKey], below recordPath: [PathKey]) -> String {
    "field-" + path.dropFirst(recordPath.count).map(\.description).joined(separator: ".")
}

/// The text a scalar shows in a text field.
private func text(of value: JSONValue?) -> String {
    switch value {
    case .string(let text): text
    case .number(let number): number == number.rounded() && abs(number) < 1e15 ? String(Int(number)) : String(number)
    case .bool(let bool): bool ? "true" : "false"
    default: ""
    }
}

/// The value a text field's `text` saves as, for a field of `kind`.
private func saved(_ text: String, as kind: FieldKind) -> JSONValue? {
    if text.isEmpty { return nil }
    if kind == .number, let number = Double(text) { return .number(number) }
    return .string(text)
}

/// A value a new list item or map entry starts as.
private func starting(_ kind: FieldKind) -> JSONValue {
    switch kind {
    case .object, .oneOf: .object([:])
    case .list: .array([])
    case .map: .object([:])
    case .toggle: .bool(false)
    case .number: .number(0)
    case .choice(let values): .string(values.first ?? "")
    default: .string("")
    }
}

/// One field: a text field, a toggle, a picker, or a group, list or map of fields.
private struct FieldRow: View {
    @Environment(AppModel.self) private var model
    let field: FormField
    let base: [PathKey]
    let value: JSONValue?
    /// the object holding this field, for a `oneOf` field, which reads which of its keys are there
    let parent: JSONValue?
    let file: String
    let recordPath: [PathKey]

    private var path: [PathKey] { base + [.key(field.key)] }

    var body: some View {
        switch field.kind {
        case .object(let fields):
            Section(field.title) {
                FieldRows(fields: fields, base: path, value: value, file: file, recordPath: recordPath)
            }
        case .list(let item, let itemTitle):
            ListField(title: field.title, item: item, itemTitle: itemTitle, path: path, items: value?.array ?? [],
                      file: file, recordPath: recordPath)
        case .map(let valueKind):
            MapField(title: field.title, valueKind: valueKind, path: path, entries: value, file: file, recordPath: recordPath)
        case .oneOf(let alternatives):
            OneOfField(field: field, alternatives: alternatives, base: base, parent: parent, file: file, recordPath: recordPath)
        default:
            ScalarField(title: field.title, help: field.help, kind: field.kind, path: path, value: value,
                        required: field.required, file: file, recordPath: recordPath)
        }
    }
}

/// A field holding one value: text of some kind, a number, a toggle or a choice.
private struct ScalarField: View {
    @Environment(AppModel.self) private var model
    let title: String
    let help: String?
    let kind: FieldKind
    let path: [PathKey]
    let value: JSONValue?
    let required: Bool
    let file: String
    let recordPath: [PathKey]

    private func apply(_ new: JSONValue?) {
        guard let key = path.last, case .key(let name) = key else {
            // an item of a list, set in place
            Task { await model.apply([.set(path, new ?? .string(""))], to: file) }
            return
        }
        let ops = fieldOps(at: Array(path.dropLast()), key: name, old: value, new: new, required: required)
        Task { await model.apply(ops, to: file) }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            control.accessibilityIdentifier(identifier(path, below: recordPath))
            if kind == .markdown, let rendered = try? AttributedString(markdown: text(of: value)), !text(of: value).isEmpty {
                Text(rendered).font(.callout).foregroundStyle(.secondary).textSelection(.enabled)
            }
            if let help { Text(help).font(.caption).foregroundStyle(.secondary) }
        }
    }

    @ViewBuilder private var control: some View {
        switch kind {
        case .toggle:
            Toggle(title, isOn: Binding(get: { value?.bool ?? false }, set: { apply(.bool($0)) }))
        case .choice(let values):
            Picker(title, selection: Binding(get: { value?.string ?? "" }, set: { apply($0.isEmpty ? nil : .string($0)) })) {
                if !required { Text("None").tag("") }
                ForEach(values, id: \.self) { Text($0).tag($0) }
            }
        default:
            HStack {
                DraftField(label: title, file: file, value: text(of: value), schedule: nil,
                           axis: kind == .markdown || kind == .multiline ? .vertical : .horizontal) { file, typed, expected, _ in
                    let new = saved(typed, as: kind)
                    let op: EditOp = if new == nil, !required, case .key? = path.last { .delete(path) } else { .set(path, new ?? .string("")) }
                    return await model.applyDraft(op, to: file, replacing: expected, schedule: nil)
                }
                if kind == .symbol, let name = value?.string, !name.isEmpty {
                    Image(systemName: name).accessibilityHidden(true)
                }
            }
        }
    }
}

/// A list of values or groups, each removable and movable, with a button to add one.
private struct ListField: View {
    @Environment(AppModel.self) private var model
    let title: String
    let item: FieldKind
    let itemTitle: String
    let path: [PathKey]
    let items: [JSONValue]
    let file: String
    let recordPath: [PathKey]

    private func apply(_ ops: [EditOp]) { Task { await model.apply(ops, to: file) } }

    /// Swaps item `from` with its neighbour, moving the items themselves so their comments go with them.
    private func move(_ from: Int, by offset: Int) {
        var order = Array(items.indices)
        order.swapAt(from, from + offset)
        Task { await model.moveItems(in: file, path: path, order: order.map { .index($0) }) }
    }

    var body: some View {
        Section(title) {
            ForEach(Array(items.enumerated()), id: \.offset) { index, value in
                let itemPath = path + [.index(index)]
                HStack(alignment: .top) {
                    if case .object(let fields) = item {
                        DisclosureGroup("\(itemTitle) \(index + 1)") {
                            FieldRows(fields: fields, base: itemPath, value: value, file: file, recordPath: recordPath)
                        }
                    } else {
                        ScalarField(title: "\(itemTitle) \(index + 1)", help: nil, kind: item, path: itemPath, value: value,
                                    required: true, file: file, recordPath: recordPath)
                    }
                    Spacer()
                    Button("Move Up", systemImage: "arrow.up") { move(index, by: -1) }
                        .labelStyle(.iconOnly).disabled(index == 0)
                    Button("Move Down", systemImage: "arrow.down") { move(index, by: 1) }
                        .labelStyle(.iconOnly).disabled(index == items.count - 1)
                    Button("Remove \(itemTitle) \(index + 1)", systemImage: "minus.circle", role: .destructive) {
                        if !isRepeatClick() { apply([.delete(itemPath)]) }
                    }
                    .labelStyle(.iconOnly)
                }
                .buttonStyle(.borderless)
            }
            Button("Add \(itemTitle)", systemImage: "plus") {
                apply([.set(path + [.index(items.count)], starting(item))])
            }
            .accessibilityIdentifier("add-" + identifier(path, below: recordPath))
            // each of these edits names an item by its place, which the edit in flight may move
            .disabled(model.edits.isShown)
        }
    }
}

/// Entries keyed by a name the contributor writes, such as a meal's name and the section it goes in.
private struct MapField: View {
    @Environment(AppModel.self) private var model
    let title: String
    let valueKind: FieldKind
    let path: [PathKey]
    let entries: JSONValue?
    let file: String
    let recordPath: [PathKey]
    @State private var newName = ""

    private var keys: [String] {
        guard case .object(let object)? = entries else { return [] }
        return object.keys.sorted()
    }

    var body: some View {
        Section(title) {
            ForEach(keys, id: \.self) { key in
                HStack(alignment: .top) {
                    if case .object(let fields) = valueKind {
                        DisclosureGroup(key) {
                            FieldRows(fields: fields, base: path + [.key(key)], value: entries?[key], file: file, recordPath: recordPath)
                        }
                    } else {
                        ScalarField(title: key, help: nil, kind: valueKind, path: path + [.key(key)], value: entries?[key],
                                    required: true, file: file, recordPath: recordPath)
                    }
                    Button("Remove \(key)", systemImage: "minus.circle", role: .destructive) {
                        Task { await model.apply([.delete(path + [.key(key)])], to: file) }
                    }
                    .labelStyle(.iconOnly)
                    .buttonStyle(.borderless)
                }
            }
            HStack {
                TextField("New name", text: $newName)
                Button("Add", systemImage: "plus") {
                    let name = newName.trimmingCharacters(in: .whitespaces)
                    guard !name.isEmpty, !keys.contains(name) else { return }
                    newName = ""
                    Task { await model.apply([.set(path + [.key(name)], starting(valueKind))], to: file) }
                }
                .disabled(newName.trimmingCharacters(in: .whitespaces).isEmpty)
            }
        }
    }
}

/// Exactly one of several fields, such as a contact's phone number or link, chosen with a picker.
private struct OneOfField: View {
    @Environment(AppModel.self) private var model
    let field: FormField
    let alternatives: [Alternative]
    let base: [PathKey]
    let parent: JSONValue?
    let file: String
    let recordPath: [PathKey]

    /// The alternative whose field the record holds, or the first when it holds none.
    private var chosen: Int {
        alternatives.firstIndex { alternative in alternative.fields.contains { parent?[$0.key] != nil } } ?? 0
    }

    /// Switches to `index`: the other alternatives' fields go, and this one's starts empty.
    private func choose(_ index: Int) {
        guard index != chosen else { return }
        var ops: [EditOp] = alternatives.enumerated().filter { $0.offset != index }
            .flatMap { $0.element.fields }.filter { parent?[$0.key] != nil }.map { .delete(base + [.key($0.key)]) }
        ops += alternatives[index].fields.map { .set(base + [.key($0.key)], starting($0.kind)) }
        Task { await model.apply(ops, to: file) }
    }

    var body: some View {
        Picker(field.title, selection: Binding(get: { chosen }, set: choose)) {
            ForEach(Array(alternatives.enumerated()), id: \.offset) { index, alternative in
                Text(alternative.label).tag(index)
            }
        }
        .pickerStyle(.segmented)
        FieldRows(fields: alternatives[chosen].fields.map {
            FormField(key: $0.key, title: $0.title, help: $0.help, kind: $0.kind, required: true)
        }, base: base, value: parent, file: file, recordPath: recordPath)
    }
}
