import SwiftUI

struct PreferencesTabViewModifier: ViewModifier {
    var sectionTitle: String

    func body(content: Content) -> some View {
        VStack(alignment: .leading, spacing: 20) {
            GroupBox(label: Text(sectionTitle)) {
                VStack(alignment: .leading) {
                    content
                }
                .fixedSize(horizontal: false, vertical: true)
            }
            .groupBoxStyle(PreferencesGroupBoxStyle())
        }
    }
}

struct PreferencesGroupBoxStyle: GroupBoxStyle {
    func makeBody(configuration: Configuration) -> some View {
        HStack(alignment: .top, spacing: 20) {
            HStack {
                Spacer()
                configuration.label
            }
            .frame(width: 120)

            VStack(alignment: .leading) {
                configuration.content
            }
        }
    }
}
