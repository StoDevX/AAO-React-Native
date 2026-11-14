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

/// The problems at `path`, under its field, as the contributor works.
private struct FieldProblems: View {
    @Environment(AppModel.self) private var model
    let path: [PathKey]
    let recordPath: [PathKey]

    var body: some View {
        ForEach(Array(AppModel.fieldProblems(at: path, among: model.shownProblems).enumerated()), id: \.offset) { _, problem in
            Text(problem.message)
                .font(.caption)
                .foregroundStyle(.red)
                .accessibilityIdentifier("problem-" + identifier(path, below: recordPath))
        }
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
    case .list, .tokens, .days: .array([])
    case .time: .string("12:00pm")
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
        case .list, .tokens, .days:
            let (item, itemTitle) = field.kind.listed(title: field.title)!
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
    @State private var choosingSymbol = false

    /// The identifier of the field's own control, which a UI test finds it by.
    private var fieldID: String { identifier(path, below: recordPath) }

    private func apply(_ new: JSONValue?) {
        // a control may set what it already shows; that is no edit
        guard new != value else { return }
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
            control
            if kind == .markdown, let text = value?.fieldText, !text.isEmpty, let rendered = try? AttributedString(markdown: text) {
                Text(rendered).font(.callout).foregroundStyle(.secondary).textSelection(.enabled)
            }
            FieldProblems(path: path, recordPath: recordPath)
            if let help { Text(help).font(.caption).foregroundStyle(.secondary) }
        }
    }

    @ViewBuilder private var control: some View {
        switch kind {
        case .toggle:
            Toggle(title, isOn: Binding(get: { value?.bool ?? false }, set: { apply(.bool($0)) }))
                .disabled(model.edits.isShown)
                .accessibilityIdentifier(fieldID)
        case .choice(let values):
            choicePicker(values)
        case .reference(let pointer):
            choicePicker(model.value.map { choices(pointer, in: $0, at: path) } ?? [])
        case .gradient(let names):
            VStack(alignment: .trailing) {
                choicePicker(names) { name in
                    model.gradients[name].flatMap { GradientSwatch(stops: $0).image }
                }
                // a gradient of its own: a well for each of its two colours
                if case .array(let stops)? = value {
                    ForEach(Array(stops.enumerated()), id: \.offset) { index, stop in
                        ColorWell(title: index == 0 ? "From" : "To", value: stop, editing: model.edits.isShown) { chosen in
                            var changed = stops
                            changed[index] = chosen
                            apply(.array(changed))
                        }
                    }
                }
            }
        case .color:
            ColorWell(title: title, value: value, editing: model.edits.isShown) { apply($0) }
                .accessibilityIdentifier(fieldID)
        case .symbol:
            VStack(alignment: .trailing) {
                HStack {
                    textField
                    Button("Choose…") { choosingSymbol = true }
                        .accessibilityIdentifier("choose-" + fieldID)
                        .disabled(model.edits.isShown)
                        .popover(isPresented: $choosingSymbol) {
                            SymbolGrid { name in
                                choosingSymbol = false
                                apply(.string(name))
                            }
                        }
                }
                if let name = value?.string, !name.isEmpty, !SymbolChooser.isSymbol(name) {
                    Text("No SF Symbol is called \(name)")
                        .font(.caption)
                        .foregroundStyle(.red)
                        .accessibilityIdentifier("symbol-problem-" + fieldID)
                }
            }
        case .date, .dateTime:
            DateField(title: title, kind: kind, value: value?.string, editing: model.edits.isShown) { apply($0.map(JSONValue.string)) }
                .accessibilityIdentifier(fieldID)
        case .url:
            HStack {
                textField
                Button("Open", systemImage: "arrow.up.forward.square") {
                    if let text = value?.string, let url = URL(string: text) { NSWorkspace.shared.open(url) }
                }
                .labelStyle(.iconOnly)
                .buttonStyle(.borderless)
                .disabled(value?.string.flatMap(URL.init(string:))?.scheme == nil)
            }
        case .phone:
            DraftField(label: title, file: file, value: PhoneNumber.display(value?.fieldText ?? ""), schedule: nil) { file, typed, expected, _ in
                let digits = PhoneNumber.digits(typed)
                let op: EditOp = digits.isEmpty && !required ? .delete(path) : .set(path, .string(digits))
                return await model.applyDraft(op, to: file, replacing: PhoneNumber.digits(expected), schedule: nil)
            }
            .accessibilityIdentifier(fieldID)
        default:
            textField
        }
    }

    /// A choice of `values`, each drawn with `image` when it gives one. A value
    /// the file holds that isn't among them is shown, marked, until another is chosen.
    private func choicePicker(_ values: [String], image: @escaping (String) -> Image? = { _ in nil }) -> some View {
        let current = value?.string ?? ""
        let unlisted = !current.isEmpty && !values.contains(current)
        return Picker(title, selection: Binding(get: { current }, set: { apply($0.isEmpty ? nil : .string($0)) })) {
            // a value that isn't a name, such as a gradient's own pair of colours
            if value != nil, value?.string == nil {
                Text("Custom").tag("")
            } else if !required || current.isEmpty {
                Text("None").tag("")
            }
            if unlisted { Text("\(current) (not listed)").tag(current) }
            ForEach(values, id: \.self) { name in
                if let image = image(name) { Label { Text(name) } icon: { image }.tag(name) } else { Text(name).tag(name) }
            }
        }
        .disabled(model.edits.isShown)
        .accessibilityIdentifier(fieldID)
    }

    @ViewBuilder private var textField: some View {
            HStack {
                DraftField(label: title, file: file, value: value?.fieldText ?? "", schedule: nil,
                           axis: kind == .markdown || kind == .multiline ? .vertical : .horizontal) { file, typed, expected, _ in
                    let new = saved(typed, as: kind)
                    let op: EditOp = if new == nil, !required, case .key? = path.last { .delete(path) } else { .set(path, new ?? .string("")) }
                    return await model.applyDraft(op, to: file, replacing: expected, schedule: nil)
                }
                .accessibilityIdentifier(fieldID)
                if kind == .symbol, let name = value?.string, !name.isEmpty {
                    Image(systemName: name).accessibilityHidden(true)
                }
            }
    }
}

extension FieldKind {
    /// The list a field of this kind is drawn as, its items and what each is
    /// called: tokens and days are lists of names until they have controls of their own.
    func listed(title: String) -> (item: FieldKind, itemTitle: String)? {
        switch self {
        case .list(let item, let itemTitle): (item, itemTitle)
        case .tokens(let pointer): (pointer.map { .reference(pointer: $0) } ?? .text, title)
        case .days: (.choice(Weekday.allCases.map(\.rawValue)), title)
        default: nil
        }
    }
}

/// How a list item or map entry is drawn: a group, list or map opens to show
/// its own fields, and anything else is one field.
enum ItemControl {
    case group([FormField])
    case list(item: FieldKind, itemTitle: String)
    case map(value: FieldKind)
    case field

    init(_ kind: FieldKind) {
        switch kind {
        case .object(let fields): self = .group(fields)
        case .list, .tokens, .days:
            let (item, itemTitle) = kind.listed(title: "")!
            self = .list(item: item, itemTitle: itemTitle)
        case .map(let value): self = .map(value: value)
        default: self = .field
        }
    }
}

/// A group of fields that opens from its whole title, not only from the chevron before it.
private struct ItemGroup<Content: View>: View {
    let title: String
    @Binding var isExpanded: Bool
    @ViewBuilder let content: () -> Content

    var body: some View {
        DisclosureGroup(isExpanded: $isExpanded, content: content) {
            Button(title) { withAnimation { isExpanded.toggle() } }
                .buttonStyle(.plain)
                .frame(maxWidth: .infinity, alignment: .leading)
                .contentShape(Rectangle())
        }
    }
}

/// One list item or map entry, drawn by its kind: a group, list or map opens to show its own fields.
private struct ItemField: View {
    let title: String
    /// whether its group is open, which its list keeps so Expand All can open them all
    @Binding var isExpanded: Bool
    let kind: FieldKind
    let path: [PathKey]
    let value: JSONValue?
    let file: String
    let recordPath: [PathKey]

    var body: some View {
        switch ItemControl(kind) {
        case .group(let fields):
            ItemGroup(title: title, isExpanded: $isExpanded) {
                FieldRows(fields: fields, base: path, value: value, file: file, recordPath: recordPath)
            }
        case .list(let item, let itemTitle):
            ItemGroup(title: title, isExpanded: $isExpanded) {
                ListItems(item: item, itemTitle: itemTitle, path: path, items: value?.array ?? [], file: file, recordPath: recordPath)
            }
        case .map(let valueKind):
            ItemGroup(title: title, isExpanded: $isExpanded) {
                MapEntries(valueKind: valueKind, path: path, entries: value, file: file, recordPath: recordPath)
            }
        case .field:
            ScalarField(title: title, help: nil, kind: kind, path: path, value: value,
                        required: true, file: file, recordPath: recordPath)
        }
    }
}

/// A list of values or groups, each removable and movable, with a button to add one.
private struct ListField: View {
    let title: String
    let item: FieldKind
    let itemTitle: String
    let path: [PathKey]
    let items: [JSONValue]
    let file: String
    let recordPath: [PathKey]

    var body: some View {
        Section(title) {
            ListItems(item: item, itemTitle: itemTitle, path: path, items: items, file: file, recordPath: recordPath)
        }
    }
}

/// A list's items and its Add button, and Expand All when they are groups.
private struct ListItems: View {
    @Environment(AppModel.self) private var model
    let item: FieldKind
    let itemTitle: String
    let path: [PathKey]
    let items: [JSONValue]
    let file: String
    let recordPath: [PathKey]
    /// the items whose groups are open: a list of one starts open, as there is nothing to choose between
    @State private var open: Set<Int>

    init(item: FieldKind, itemTitle: String, path: [PathKey], items: [JSONValue], file: String, recordPath: [PathKey]) {
        self.item = item
        self.itemTitle = itemTitle
        self.path = path
        self.items = items
        self.file = file
        self.recordPath = recordPath
        _open = State(initialValue: items.count == 1 ? [0] : [])
    }

    private func isOpen(_ index: Int) -> Binding<Bool> {
        Binding(get: { open.contains(index) }, set: { if $0 { open.insert(index) } else { open.remove(index) } })
    }

    private func apply(_ ops: [EditOp]) { Task { await model.apply(ops, to: file) } }

    /// Swaps item `from` with its neighbour, moving the items themselves so their comments go with them.
    private func move(_ from: Int, by offset: Int) {
        var order = Array(items.indices)
        order.swapAt(from, from + offset)
        // an open group stays open as it moves
        open = Set(open.map { $0 == from ? from + offset : $0 == from + offset ? from : $0 })
        Task { await model.moveItems(in: file, path: path, order: order.map { .index($0) }) }
    }

    var body: some View {
        // each of these edits names an item by its place, which the edit in flight may move
        let editing = model.edits.isShown
        if case .field = ItemControl(item) {} else if items.count > 1 {
            let allOpen = open.count == items.count
            Button(allOpen ? "Collapse All" : "Expand All") {
                withAnimation { open = allOpen ? [] : Set(items.indices) }
            }
            .buttonStyle(.link)
            .accessibilityIdentifier("expand-all-" + identifier(path, below: recordPath))
        }
        ForEach(Array(items.enumerated()), id: \.offset) { index, value in
            HStack(alignment: .top) {
                ItemField(title: "\(itemTitle) \(index + 1)", isExpanded: isOpen(index), kind: item, path: path + [.index(index)], value: value,
                          file: file, recordPath: recordPath)
                Spacer()
                Button("Move Up", systemImage: "arrow.up") { move(index, by: -1) }
                    .labelStyle(.iconOnly).disabled(editing || index == 0)
                Button("Move Down", systemImage: "arrow.down") { move(index, by: 1) }
                    .labelStyle(.iconOnly).disabled(editing || index == items.count - 1)
                Button("Remove \(itemTitle) \(index + 1)", systemImage: "minus.circle", role: .destructive) {
                    if !isRepeatClick() { apply([.delete(path + [.index(index)])]) }
                }
                .labelStyle(.iconOnly).disabled(editing)
            }
            .buttonStyle(.borderless)
        }
        Button("Add \(itemTitle)", systemImage: "plus") {
            // a new group opens, ready to fill in
            open.insert(items.count)
            apply([.set(path + [.index(items.count)], starting(item))])
        }
        .accessibilityIdentifier("add-" + identifier(path, below: recordPath))
        .disabled(editing)
    }
}

/// Entries keyed by a name the contributor writes, such as a meal's name and the section it goes in.
private struct MapField: View {
    let title: String
    let valueKind: FieldKind
    let path: [PathKey]
    let entries: JSONValue?
    let file: String
    let recordPath: [PathKey]

    var body: some View {
        Section(title) {
            MapEntries(valueKind: valueKind, path: path, entries: entries, file: file, recordPath: recordPath)
        }
    }
}

/// A map's entries and the field that adds one.
private struct MapEntries: View {
    @Environment(AppModel.self) private var model
    let valueKind: FieldKind
    let path: [PathKey]
    let entries: JSONValue?
    let file: String
    let recordPath: [PathKey]
    @State private var newName = ""
    /// the entries whose groups are open: a map of one starts open
    @State private var open: Set<String>

    init(valueKind: FieldKind, path: [PathKey], entries: JSONValue?, file: String, recordPath: [PathKey]) {
        self.valueKind = valueKind
        self.path = path
        self.entries = entries
        self.file = file
        self.recordPath = recordPath
        let keys: [String] = if case .object(let object)? = entries { Array(object.keys) } else { [] }
        _open = State(initialValue: keys.count == 1 ? Set(keys) : [])
    }

    private func isOpen(_ key: String) -> Binding<Bool> {
        Binding(get: { open.contains(key) }, set: { if $0 { open.insert(key) } else { open.remove(key) } })
    }

    private var keys: [String] {
        guard case .object(let object)? = entries else { return [] }
        return object.keys.sorted()
    }

    var body: some View {
        if case .field = ItemControl(valueKind) {} else if keys.count > 1 {
            let allOpen = open.isSuperset(of: keys)
            Button(allOpen ? "Collapse All" : "Expand All") {
                withAnimation { open = allOpen ? [] : Set(keys) }
            }
            .buttonStyle(.link)
            .accessibilityIdentifier("expand-all-" + identifier(path, below: recordPath))
        }
        ForEach(keys, id: \.self) { key in
            HStack(alignment: .top) {
                ItemField(title: key, isExpanded: isOpen(key), kind: valueKind, path: path + [.key(key)], value: entries?[key],
                          file: file, recordPath: recordPath)
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
                open.insert(name)
                Task { await model.apply([.set(path + [.key(name)], starting(valueKind))], to: file) }
            }
            .disabled(newName.trimmingCharacters(in: .whitespaces).isEmpty)
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
        .pickerStyle(.menu)
        FieldRows(fields: alternatives[chosen].fields.map {
            FormField(key: $0.key, title: $0.title, help: $0.help, kind: $0.kind, required: true)
        }, base: base, value: parent, file: file, recordPath: recordPath)
    }
}
