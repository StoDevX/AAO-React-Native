// Adapted from andreasley/CustomFormStyle (Apache License 2.0):
// https://github.com/andreasley/CustomFormStyle
import SwiftUI

extension EnvironmentValues {
    /// The form's width, which its label column is a share of.
    @Entry var formWidth: CGFloat = 400
}

/// A data form: its labels in one column on the left, and every field, value
/// and control starting at one edge beside them, in sections like a grouped
/// form's. The system's grouped form puts each value against the right edge,
/// which leaves a field's text, its box and its label far apart.
struct EditorFormStyle: FormStyle {
    func makeBody(configuration: Configuration) -> some View {
        GeometryReader { geometry in
            ScrollView {
                VStack(alignment: .leading, spacing: 8) {
                    ForEach(sections: configuration.content) { section in
                        EditorFormSection(section: section)
                    }
                }
                .labeledContentStyle(LabelColumnStyle())
                .textFieldStyle(LabelColumnTextFieldStyle())
                .toggleStyle(.switch)
                .environment(\.formWidth, geometry.size.width)
                .padding()
            }
        }
        .background(Color(nsColor: .windowBackgroundColor))
        .frame(minWidth: 300)
    }
}

extension FormStyle where Self == EditorFormStyle {
    /// Labels in a column on the left, and each value beside its label.
    static var editor: EditorFormStyle { EditorFormStyle() }
}

/// One section: its header, its rows in a rounded box with a line between each, and its footer.
private struct EditorFormSection: View {
    let section: SectionConfiguration

    var body: some View {
        if !section.header.isEmpty {
            section.header
                .font(.headline)
                .padding(.top, 8)
        }
        VStack(alignment: .leading, spacing: 0) {
            Group(subviews: section.content) { rows in
                let last = rows.last?.id
                ForEach(rows) { row in
                    row
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(10)
                    if row.id != last {
                        // a plain line: `Divider` tints what follows it
                        Rectangle()
                            .fill(Color(nsColor: .separatorColor))
                            .frame(height: 1)
                            .padding(.horizontal, 10)
                    }
                }
            }
        }
        .background(RoundedRectangle(cornerRadius: 8).fill(Color(nsColor: .controlBackgroundColor)))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color(nsColor: .separatorColor)))
        if !section.footer.isEmpty {
            section.footer
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }
}

/// A label in the form's label column, and its content beside it from the left.
private struct LabelColumn<Label: View, Content: View>: View {
    @Environment(\.formWidth) private var formWidth
    let label: Label
    let content: Content

    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            label
                .frame(width: min(formWidth * 0.3, 200), alignment: .leading)
            content
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .frame(minHeight: 20)
    }
}

/// `LabeledContent` in the label column.
private struct LabelColumnStyle: LabeledContentStyle {
    func makeBody(configuration: Configuration) -> some View {
        LabelColumn(label: configuration.label, content: configuration.content)
    }
}

/// A text field in a box, its label in the label column. SwiftUI gives a text
/// field style no label of its own, so it is read from the field by reflection;
/// a field whose label is hidden, or that has none, is the box alone.
private struct LabelColumnTextFieldStyle: @preconcurrency TextFieldStyle {
    @MainActor
    func _body(configuration: TextField<Self._Label>) -> some View {
        LabelledTextField(field: configuration, label: Mirror(reflecting: configuration).descendant("label") as? _TextFieldStyleLabel)
    }
}

private struct LabelledTextField<Field: View>: View {
    @Environment(\.labelsVisibility) private var labelsVisibility
    let field: Field
    let label: _TextFieldStyleLabel?

    var body: some View {
        let boxed = field.textFieldStyle(.roundedBorder).multilineTextAlignment(.leading)
        if let label, labelsVisibility != .hidden {
            LabelColumn(label: label, content: boxed.labelsHidden())
        } else {
            boxed
        }
    }
}
