import Foundation

/// Where a station's audio, and the song now on air, come from.
nonisolated struct StationSources: Equatable, Sendable {
    /// The stream to play, or nil if no manifest names one the app can play.
    let streamURL: URL?
    /// krlx.org's `metaradio` feed, for a station that publishes one.
    let nowPlayingURL: URL?
}

/// The sources manifest the app reads (`data/sources.yaml`), as far as the radio
/// needs it: a JRD document (RFC 7033 §4.4) listing where each source is.
nonisolated struct SourcesManifest: Decodable, Sendable {
    nonisolated struct Link: Decodable, Sendable {
        let rel: String
        let href: String
        let type: String?
        /// JRD allows a property's value to be null.
        let properties: [String: String?]?
    }

    let links: [Link]

    /// The server a relative address names: St. Olaf's, which publishes the manifest.
    static let serverURL = URL(string: "https://stolaf.frogpond.tech/v1/")!
    private static let streamRel = "https://frogpond.tech/rel/radio-stream"
    private static let nowPlayingRel = "https://frogpond.tech/rel/radio-now-playing"
    private static let idProperty = "https://frogpond.tech/ns/id"
    /// The streams AVPlayer plays: HLS, and the MP3 and AAC an Icecast or Shoutcast server sends.
    private static let streamTypes: Set = ["application/vnd.apple.mpegurl", "audio/mpeg", "audio/aac"]
    private static let nowPlayingTypes: Set = ["application/vnd.metaradio.stationnow+json"]

    /// The copy the app ships, which `mise run bundle-data` writes from `data/sources.yaml`.
    static let bundled: SourcesManifest = {
        let url = Bundle.main.url(forResource: "bundled", withExtension: "json")!
        return try! JSONDecoder().decode(SourcesManifest.self, from: Data(contentsOf: url))
    }()

    /// `station`'s sources as this manifest names them, each one it does not
    /// name usably taken from `fallback` instead.
    func stationSources(for station: Station, fallback: SourcesManifest) -> StationSources {
        StationSources(
            streamURL: url(Self.streamRel, for: station, types: Self.streamTypes)
                ?? fallback.url(Self.streamRel, for: station, types: Self.streamTypes),
            nowPlayingURL: url(Self.nowPlayingRel, for: station, types: Self.nowPlayingTypes)
                ?? fallback.url(Self.nowPlayingRel, for: station, types: Self.nowPlayingTypes)
        )
    }

    /// The web address of `station`'s first `rel` entry, if that entry is of
    /// one of `types` and is a web address; a relative one names the server.
    private func url(_ rel: String, for station: Station, types: Set<String>) -> URL? {
        guard let entry = links.first(where: { $0.rel == rel && ($0.properties?[Self.idProperty] ?? nil) == station.rawValue }),
              let type = entry.type, types.contains(type),
              let url = URL(string: entry.href, relativeTo: Self.serverURL)?.absoluteURL,
              url.scheme == "https" || url.scheme == "http"
        else { return nil }
        return url
    }
}
