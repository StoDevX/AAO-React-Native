import DataEditorKit
import SwiftUI

/// Any St. Olaf route, from the local Worker and from production, side by side.
struct DataBrowserView: View {
    @Environment(AppModel.self) private var model
    @State private var route = "spaces/hours"
    @State private var local = ""
    @State private var production = ""
    /// The load under way, cancelled by the next so an older answer never lands over a newer one.
    @State private var loading: Task<Void, Never>?

    private static let productionBase = URL(string: "https://stolaf.frogpond.tech/v1/")!

    /// `route` without the slashes and spaces a pasted route brings, so it appends to a base.
    static func routePath(_ route: String) -> String {
        route.trimmingCharacters(in: CharacterSet(charactersIn: "/ "))
    }

    /// Where the This Mac pane asks for `path`: the local Worker, which answers
    /// only while the preview runs, so at any other time nowhere.
    static func localURL(for path: String, status: CccRunner.Status) -> URL? {
        status == .running ? cccLocalBase.appending(path: path) : nil
    }

    /// Where the Production pane asks for `path`: production, except under
    /// UI tests, which must not depend on it or add to its traffic.
    static func productionURL(for path: String, underUITests: Bool) -> URL? {
        underUITests ? nil : productionBase.appending(path: path)
    }

    var body: some View {
        let previewRunning = model.cccStatus == .running
        VStack {
            HStack {
                TextField("Route", text: $route).onSubmit { reload() }
                Button("Load") { reload() }.keyboardShortcut(.defaultAction)
            }
            .padding([.horizontal, .top])
            HSplitView {
                Pane(title: "This Mac", text: local, identifier: "local-pane")
                Pane(title: "Production", text: production, identifier: "production-pane")
            }
        }
        .frame(minWidth: 900, minHeight: 500)
        // loads again as the preview starts or stops, so the This Mac pane follows it
        .onChange(of: previewRunning, initial: true) { reload() }
        .onDisappear { loading?.cancel() }
    }

    private func reload() {
        loading?.cancel()
        loading = Task { await load() }
    }

    private func load() async {
        let path = Self.routePath(route)
        let productionURL = Self.productionURL(for: path, underUITests: model.runsUnderUITests)
        async let production: String? = if let productionURL { await Self.fetch(productionURL) } else { nil }
        let local = if let url = Self.localURL(for: path, status: model.cccStatus) {
            await Self.fetch(url)
        } else {
            "Start the preview to see this Mac's data.\nThe local Worker answers only while the preview runs."
        }
        let fetched = await production
        guard !Task.isCancelled else { return }
        self.local = local
        self.production = fetched ?? "Production is not asked under UI tests."
    }

    private static func fetch(_ url: URL) async -> String {
        do {
            let (data, response) = try await URLSession.shared.data(from: url)
            let status = (response as? HTTPURLResponse)?.statusCode ?? 0
            let pretty = (try? JSONSerialization.jsonObject(with: data))
                .flatMap { try? JSONSerialization.data(withJSONObject: $0, options: [.prettyPrinted, .sortedKeys, .withoutEscapingSlashes]) }
                .map { String(decoding: $0, as: UTF8.self) } ?? String(decoding: data, as: UTF8.self)
            return "\(status) \(response.url?.absoluteString ?? url.absoluteString)\n\n\(pretty)"
        } catch {
            return "\(url.absoluteString)\n\n\(error.localizedDescription)"
        }
    }

    /// One side's response: its status, address and pretty-printed body.
    private struct Pane: View {
        let title: String
        let text: String
        let identifier: String

        var body: some View {
            VStack(alignment: .leading) {
                Text(title).font(.headline)
                ScrollView([.vertical, .horizontal]) {
                    Text(text).font(.caption.monospaced()).textSelection(.enabled).frame(maxWidth: .infinity, alignment: .leading)
                        .accessibilityIdentifier(identifier)
                }
            }
            .padding()
        }
    }
}
