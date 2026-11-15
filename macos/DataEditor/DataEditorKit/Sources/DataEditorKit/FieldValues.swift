import Foundation

/// A colour as a data file writes it: `rgb(134, 198, 124)`, `color(display-p3
/// 0.9294 0.4863 0.5216)` or `[82, 87, 54]`. It writes itself back in the same
/// form, so a colour nobody changed reads exactly as it did.
public struct ColorValue: Equatable, Sendable {
    public enum Form: Equatable, Sendable {
        /// `rgb(r, g, b)`, 0–255, with or without a space after each comma
        case rgb(spaced: Bool)
        /// `color(display-p3 r g b)`, 0–1, to as many places as the file gave
        case displayP3(places: Int)
        /// `[r, g, b]`, 0–255
        case triple
        /// `#E4A01B` or `#fff`, 0–255, its letters in the case the file used
        case hex(lowercase: Bool, short: Bool)
    }

    /// The red, green and blue components in the form's own units.
    public let components: [Double]
    public let form: Form

    public init?(_ value: JSONValue) {
        switch value {
        case .array(let items):
            let numbers = items.compactMap { if case .number(let number) = $0 { number } else { nil } }
            guard numbers.count == 3, items.count == 3 else { return nil }
            components = numbers
            form = .triple
        case .string(let text):
            if let match = text.wholeMatch(of: /rgb\((\d+),( ?)(\d+), ?(\d+)\)/) {
                components = [match.1, match.3, match.4].compactMap { Double($0) }
                form = .rgb(spaced: !match.2.isEmpty)
            } else if let match = text.wholeMatch(of: /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})/) {
                let digits = Array(match.1)
                let short = digits.count == 3
                components = (0..<3).compactMap { index in
                    let pair = short ? String([digits[index], digits[index]]) : String(digits[index * 2...index * 2 + 1])
                    return Int(pair, radix: 16).map(Double.init)
                }
                form = .hex(lowercase: digits.contains(where: \.isLowercase), short: short)
            } else if let match = text.wholeMatch(of: /color\(display-p3 ([0-9.]+) ([0-9.]+) ([0-9.]+)\)/) {
                let parts = [match.1, match.2, match.3].map(String.init)
                components = parts.compactMap(Double.init)
                form = .displayP3(places: parts.map { $0.split(separator: ".").last.map(\.count) ?? 0 }.max() ?? 0)
            } else {
                return nil
            }
            guard components.count == 3 else { return nil }
        default:
            return nil
        }
    }

    private init(components: [Double], form: Form) {
        self.components = components
        self.form = form
    }

    /// The components between 0 and 1, in the form's colour space.
    public var unit: [Double] {
        if case .displayP3 = form { return components }
        return components.map { $0 / 255 }
    }

    /// This colour with `unit` components, rounded to what its form writes.
    public func with(unit: [Double]) -> ColorValue {
        switch form {
        case .displayP3(let places):
            let scale = pow(10, Double(max(places, 1)))
            return ColorValue(components: unit.map { ($0 * scale).rounded() / scale }, form: form)
        case .rgb, .triple, .hex:
            return ColorValue(components: unit.map { ($0 * 255).rounded() }, form: form)
        }
    }

    /// The colour as the file writes it.
    public func json() -> JSONValue {
        let whole = components.map { String(Int($0)) }
        switch form {
        case .triple:
            return .array(components.map(JSONValue.number))
        case .rgb(let spaced):
            return .string("rgb(\(whole.joined(separator: spaced ? ", " : ",")))")
        case .hex(let lowercase, let short):
            let values = components.map(Int.init)
            // three digits while each pair repeats one, as `#fff` does; six once a colour needs them
            let keepsShort = short && values.allSatisfy { $0 % 17 == 0 }
            let text = values.map { keepsShort ? String($0 / 17, radix: 16) : String(format: "%02x", $0) }.joined()
            return .string("#" + (lowercase ? text : text.uppercased()))
        case .displayP3:
            // each place as the file gave it, without trailing zeros: 0.902 stays 0.902
            let text = components.map { $0.formatted(.number.precision(.fractionLength(0...6)).grouping(.never).locale(Locale(identifier: "en_US_POSIX"))) }
            return .string("color(display-p3 \(text.joined(separator: " ")))")
        }
    }
}

/// A phone number as the data holds it, digits only, and as a person reads it.
public enum PhoneNumber {
    /// Ten digits as `(507) 786-3666`; anything else as it is.
    public static func display(_ digits: String) -> String {
        guard digits.count == 10, digits.allSatisfy(\.isNumber) else { return digits }
        let characters = Array(digits)
        return "(\(String(characters[0..<3]))) \(String(characters[3..<6]))-\(String(characters[6...]))"
    }

    /// The digits of what was typed, which is what the data holds.
    public static func digits(_ typed: String) -> String { typed.filter(\.isNumber) }
}

/// The values a field may take from elsewhere in its file, as its schema's
/// `x-choices` names them, once each in the order found. `pointer` is a JSON
/// pointer whose `*` stands for every item or entry; one beginning with a
/// number climbs that many levels above the list holding `fieldPath`, the
/// value's own path, before it follows the rest. A map at the end gives its
/// names, in alphabetical order, as the form lists a map's entries.
public func choices(_ pointer: String, in file: JSONValue, at fieldPath: [PathKey]) -> [String] {
    var base: [PathKey] = []
    var rest = Substring(pointer)
    if let climb = pointer.prefixMatch(of: /(\d+)\//) {
        base = Array(fieldPath.dropLast((Int(climb.1) ?? 0) + 1))
        rest = pointer[climb.range.upperBound...]
    } else {
        rest = rest.dropFirst()
    }
    let keys = rest.isEmpty ? [] : rest.split(separator: "/", omittingEmptySubsequences: false)
        .map { String($0).replacing("~1", with: "/").replacing("~0", with: "~") }
    var values = file[path: base].map { [$0] } ?? []
    for key in keys {
        values = values.flatMap { value -> [JSONValue] in
            switch (key, value) {
            case ("*", .array(let items)): items
            case ("*", .object(let object)): object.keys.sorted().compactMap { object[$0] }
            case (_, .array(let items)): Int(key).flatMap { items.indices.contains($0) ? [items[$0]] : nil } ?? []
            case (_, .object(let object)): object[key].map { [$0] } ?? []
            default: []
            }
        }
    }
    var seen = Set<String>()
    return values.flatMap { value -> [String] in
        switch value {
        case .string(let text): [text]
        case .object(let object): object.keys.sorted()
        case .array(let items): items.compactMap(\.string)
        default: []
        }
    }.filter { seen.insert($0).inserted }
}

/// What a list item calls itself: its own name, title or label, as a food
/// item's `label: Pizza` or a show's `title`, or nil when it has none of them.
public func itemName(_ item: JSONValue?) -> String? {
    for key in ["name", "title", "label"] {
        if let name = item?[key]?.string?.trimmingCharacters(in: .whitespaces), !name.isEmpty { return name }
    }
    return nil
}
