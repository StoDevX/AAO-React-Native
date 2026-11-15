import AppKit
import DataEditorKit
import SwiftUI

/// A colour chosen in the system's colour well, written back in the form the
/// file gave it. A value no form reads, such as `red`, is shown as text,
/// marked, with a button to put a colour in its place; a missing one offers to
/// add `seed`, a colour in the form the schema wants. An optional colour can
/// be removed again, when `remove` is given.
struct ColorWell: View {
    let title: String
    let value: JSONValue?
    let seed: JSONValue
    var identifier: String?
    var remove: (() -> Void)? = nil
    let set: (JSONValue) -> Void

    @ViewBuilder private var removeButton: some View {
        if let remove {
            Button("Remove \(title)", systemImage: "minus.circle", role: .destructive, action: remove)
                .labelStyle(.iconOnly)
                .buttonStyle(.borderless)
                .accessibilityIdentifier("remove-colour-" + (identifier ?? ""))
        }
    }

    /// `value` as AppKit draws it, in the colour space its form is written in.
    static func nsColor(_ value: ColorValue) -> NSColor {
        let unit = value.unit
        if case .displayP3 = value.form {
            return NSColor(displayP3Red: unit[0], green: unit[1], blue: unit[2], alpha: 1)
        }
        return NSColor(srgbRed: unit[0], green: unit[1], blue: unit[2], alpha: 1)
    }

    /// `color`'s components between 0 and 1, in the colour space `form` is written in.
    static func unit(of color: NSColor, for form: ColorValue.Form) -> [Double] {
        let space: NSColorSpace = if case .displayP3 = form { .displayP3 } else { .sRGB }
        guard let converted = color.usingColorSpace(space) else { return [0, 0, 0] }
        return [converted.redComponent, converted.greenComponent, converted.blueComponent].map(Double.init)
    }

    var body: some View {
        if let value, let color = ColorValue(value) {
            LabeledContent(title) {
                HStack {
                    // the well first, as a swatch leads its name in a menu, then the colour as the file writes it
                    ColorPicker(title, selection: Binding(
                        get: { Color(nsColor: Self.nsColor(color)) },
                        set: { chosen in
                            let new = color.with(unit: Self.unit(of: NSColor(chosen), for: color.form)).json()
                            // the well reports the colour it was given; only a different one is an edit
                            if new != value { set(new) }
                        }), supportsOpacity: false)
                        .labelsHidden()
                        .accessibilityIdentifier(identifier ?? "")
                    Text(value.string ?? color.components.map { String(Int($0)) }.joined(separator: ", "))
                        .foregroundStyle(.secondary)
                        .textSelection(.enabled)
                    removeButton
                }
            }
        } else if let value {
            LabeledContent(title) {
                HStack {
                    Text(value.fieldText.isEmpty ? "Not a colour" : value.fieldText).foregroundStyle(.red)
                    Button("Replace with a Colour") { set(seed) }
                    removeButton
                }
            }
        } else {
            LabeledContent(title) {
                Button("Add Colour") { set(seed) }
                    .accessibilityIdentifier("add-colour-" + (identifier ?? ""))
            }
        }
    }
}
