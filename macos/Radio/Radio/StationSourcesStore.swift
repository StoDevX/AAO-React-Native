import Foundation

/// The stations' sources, from the manifest last fetched from the server,
/// else the one the app ships. A fetched manifest is saved, so it outlasts
/// the launch that fetched it.
final class StationSourcesStore {
    /// The manifest the app reads too; ccc-server redirects it to the published copy.
    static let manifestURL = URL(string: "https://stolaf.frogpond.tech/v1/sources")!

    /// The app's own folder in Application Support.
    static var defaultDirectory: URL {
        URL.applicationSupportDirectory.appending(path: Bundle.main.bundleIdentifier ?? "Radio", directoryHint: .isDirectory)
    }

    /// Whether a launch in `environment` fetches the manifest: not one that
    /// hosts unit tests, which must leave the server and the saved copy alone.
    static func refreshesAtLaunch(environment: [String: String] = ProcessInfo.processInfo.environment) -> Bool {
        environment["XCTestConfigurationFilePath"] == nil
    }

    private let savedURL: URL
    private let fetch: @Sendable (URL) async -> Data?
    /// The last manifest fetched, in this launch or an earlier one.
    private var published: SourcesManifest?

    /// `fetch` answers a URL with its response, or nil if it cannot be had.
    init(
        directory: URL = StationSourcesStore.defaultDirectory,
        fetch: @escaping @Sendable (URL) async -> Data? = { try? await URLSession.shared.data(from: $0).0 }
    ) {
        savedURL = directory.appending(path: "sources.json")
        self.fetch = fetch
        published = (try? Data(contentsOf: savedURL)).flatMap { try? JSONDecoder().decode(SourcesManifest.self, from: $0) }
    }

    /// Fetches the manifest, and uses and saves it if it is one; otherwise
    /// keeps what it had.
    func refresh() async {
        guard let data = await fetch(Self.manifestURL),
              let manifest = try? JSONDecoder().decode(SourcesManifest.self, from: data)
        else { return }
        published = manifest
        try? FileManager.default.createDirectory(at: savedURL.deletingLastPathComponent(), withIntermediateDirectories: true)
        try? data.write(to: savedURL, options: .atomic)
    }

    /// `station`'s sources as the fetched manifest names them, else as shipped.
    func sources(for station: Station) -> StationSources {
        (published ?? .bundled).stationSources(for: station, fallback: .bundled)
    }
}
