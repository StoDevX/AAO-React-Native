import DataEditorKit
import SwiftUI

/// A file changed both on GitHub and by the contributor, with the two
/// versions to compare before choosing which stays.
struct ConflictRow: View {
    @Environment(AppModel.self) private var model
    let file: String
    @State private var showingDifferences = false

    var body: some View {
        let name = model.name(of: file)
        let deleted = model.conflictCopy(of: file) == .deleted
        VStack(alignment: .leading, spacing: 6) {
            HStack(alignment: .firstTextBaseline) {
                Label {
                    VStack(alignment: .leading) {
                        Text("\(name) changed on GitHub too. Which version should stay?")
                        Text(file).font(.caption).foregroundStyle(.secondary)
                    }
                } icon: { Image(systemName: "exclamationmark.2") }
                Spacer()
                Button(showingDifferences ? "Hide Differences" : "Show Differences") { showingDifferences.toggle() }
                    .accessibilityIdentifier("show-differences-\(file)")
            }
            if showingDifferences {
                if let diff = model.conflictDiff(for: file) {
                    Text("Your version compared with GitHub's").font(.caption).foregroundStyle(.secondary)
                    ScrollView { DiffView(rows: diffRows(diff)).frame(maxWidth: .infinity, alignment: .leading) }
                        .frame(maxHeight: 200)
                } else if deleted {
                    Text("You removed this file, and GitHub changed it.")
                }
            }
            HStack {
                Text(deleted ? "Keeping yours removes the file, with GitHub's changes to it."
                             : "Keeping yours replaces the whole file, including GitHub's changes to it.")
                    .font(.caption).foregroundStyle(.secondary)
                Spacer()
                Button("Use GitHub's Version") { Task { await model.keepLatest(file) } }
                    .accessibilityLabel("Use GitHub's version of \(name)")
                    .accessibilityIdentifier("keep-latest-\(file)")
                Button("Keep My Version") { Task { await model.keepMine(file) } }
                    .accessibilityLabel("Keep my version of \(name)")
                    .accessibilityIdentifier("keep-mine-\(file)")
            }
        }
        .padding(.horizontal)
    }
}

/// A file's diff rows: changed lines prefixed `+ ` or `- `, unchanged ones
/// two spaces, each before the file's own indentation.
struct DiffView: View {
    let rows: [DiffRow]

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ForEach(Array(rows.enumerated()), id: \.offset) { _, row in
                switch row {
                case .gap:
                    Text("⋯").font(.body.monospaced()).foregroundStyle(.secondary)
                        .accessibilityLabel("Unchanged lines left out")
                case .line(let line):
                    Text(Self.prefix(line.kind) + line.text)
                        .font(.body.monospaced())
                        .foregroundStyle(Self.color(line.kind))
                        .textSelection(.enabled)
                }
            }
        }
    }

    private static func prefix(_ kind: DiffLine.Kind) -> String {
        switch kind {
        case .added: "+ "
        case .removed: "- "
        case .same: "  "
        }
    }

    private static func color(_ kind: DiffLine.Kind) -> Color {
        switch kind {
        case .added: .green
        case .removed: .red
        case .same: .secondary
        }
    }
}
