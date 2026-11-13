import Foundation

/// How a form draws one field, decided by its schema and its `editor` hint.
public indirect enum FieldKind: Hashable, Sendable {
    case text, multiline, markdown, symbol, gradient, phone, url, date, color, image, toggle, number
    /// one of a fixed set of values
    case choice([String])
    /// a group of fields
    case object([FormField])
    /// a list of values or groups, each called `itemTitle`
    case list(item: FieldKind, itemTitle: String)
    /// entries keyed by a name the contributor writes, such as a meal's name
    case map(value: FieldKind)
    /// exactly one of several fields, as a contact has a phone number or a link
    case oneOf([Alternative])
}

/// One choice of a `oneOf` field: its label, and the fields it fills in.
public struct Alternative: Hashable, Sendable {
    public let label: String
    public let fields: [FormField]
    public init(label: String, fields: [FormField]) {
        self.label = label
        self.fields = fields
    }
}

/// One field of a record's form.
public struct FormField: Hashable, Sendable, Identifiable {
    /// The field's key in the record; a `oneOf` field's keys joined with `|`.
    public let key: String
    public let title: String
    /// The schema's `description`, shown under the field.
    public let help: String?
    public let kind: FieldKind
    public let required: Bool
    public var id: String { key }

    public init(key: String, title: String, help: String?, kind: FieldKind, required: Bool) {
        self.key = key
        self.title = title
        self.help = help
        self.kind = kind
        self.required = required
    }
}

/// The control an `editor` hint names.
private let hinted: [String: FieldKind] = [
    "markdown": .markdown, "multiline": .multiline, "symbol": .symbol, "gradient": .gradient,
    "phone": .phone, "url": .url, "date": .date, "color": .color, "image": .image,
]

/// How `schema` draws, with `title` as the name of one list item when it names none of its own.
private func kind(of schema: JSONValue, title: String) -> FieldKind {
    if let hint = schema["editor"]?.string, let kind = hinted[hint] { return kind }
    if let values = schema["enum"]?.array { return .choice(values.compactMap(\.string)) }
    switch schema["type"]?.string {
    case "boolean": return .toggle
    case "number", "integer": return .number
    case "array":
        let item = schema["items"] ?? .object([:])
        return .list(item: kind(of: item, title: title), itemTitle: item["title"]?.string ?? title)
    case "object":
        if schema["properties"] != nil { return .object(formFields(schema: schema)) }
        if let value = schema["additionalProperties"], case .object = value {
            return .map(value: kind(of: value, title: title))
        }
        return .object([])
    default:
        if let first = schema["oneOf"]?[0] ?? schema["anyOf"]?[0] { return kind(of: first, title: title) }
        return .text
    }
}

/// Whether a form leaves the field off: hidden by its hint, or fixed by `const`.
private func isLeftOut(_ schema: JSONValue) -> Bool {
    schema["editor"]?.string == "hidden" || schema["const"] != nil
}

/// The fields an object schema's form shows, in its `propertyOrder`. A
/// top-level `oneOf` whose choices each require one field becomes one field
/// that offers them, where the first of them would have been.
public func formFields(schema: JSONValue) -> [FormField] {
    guard case .object(let properties)? = schema["properties"] else { return [] }
    let order = schema["propertyOrder"]?.array?.compactMap(\.string) ?? properties.keys.sorted()
    let required = Set(schema["required"]?.array?.compactMap(\.string) ?? [])
    let choices = (schema["oneOf"]?.array ?? []).compactMap { branch -> String? in
        guard case .object(let object) = branch, object.count == 1,
              let keys = branch["required"]?.array, keys.count == 1 else { return nil }
        return keys[0].string
    }
    let offersChoice = !choices.isEmpty && choices.count == schema["oneOf"]?.array?.count

    func field(_ key: String, _ property: JSONValue) -> FormField {
        let title = property["title"]?.string ?? key
        return FormField(key: key, title: title, help: property["description"]?.string,
                         kind: kind(of: property, title: title), required: required.contains(key))
    }

    var fields: [FormField] = []
    for key in order {
        guard let property = properties[key], !isLeftOut(property) else { continue }
        if offersChoice, choices.contains(key) {
            guard key == choices.first(where: { order.contains($0) }) else { continue }
            let alternatives = choices.compactMap { choice in
                properties[choice].map { Alternative(label: $0["title"]?.string ?? choice, fields: [field(choice, $0)]) }
            }
            fields.append(FormField(key: choices.joined(separator: "|"), title: alternatives.map(\.label).joined(separator: " or "),
                                    help: nil, kind: .oneOf(alternatives), required: true))
        } else {
            fields.append(field(key, property))
        }
    }
    return fields
}

/// The edits that change the field `key` of the record at `base` from `old`
/// to `new`: nothing when it did not change, and a delete when an optional
/// field is cleared, so the file does not keep an empty value.
public func fieldOps(at base: [PathKey], key: String, old: JSONValue?, new: JSONValue?, required: Bool) -> [EditOp] {
    let path = base + [.key(key)]
    let cleared = new == nil || new == .string("")
    if cleared, !required { return old == nil ? [] : [.delete(path)] }
    let value = new ?? .string("")
    return value == old ? [] : [.set(path, value)]
}
