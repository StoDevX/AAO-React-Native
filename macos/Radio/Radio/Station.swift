import Foundation

/// The student stations the app streams, in the order the station menu lists them.
nonisolated enum Station: String, CaseIterable, Identifiable, Sendable {
    case ksto
    case krlx

    /// Where a station says what is on air.
    enum NowPlayingFeed: Sendable {
        /// krlx.org's `metaradio` WordPress plugin, which names the song on air.
        case metaradio(URL)
        /// A published weekly schedule, which names the show on air.
        case showSchedule(URL)
    }

    var id: String { rawValue }

    var name: String {
        switch self {
        case .ksto: "KSTO 93.1 FM"
        case .krlx: "KRLX 88.1 FM"
        }
    }

    /// What the player shows when the station has nothing more specific on air.
    var tagline: String {
        switch self {
        case .ksto: "St. Olaf College Radio"
        case .krlx: "Carleton College Radio"
        }
    }

    /// The same streams as `data/sources.yaml`.
    var streamURL: URL {
        switch self {
        case .ksto: URL(string: "https://cdn.stobcm.com/ksto/live.m3u8")!
        case .krlx: URL(string: "https://s3.voscast.com:10803/stream")!
        }
    }

    var websiteURL: URL {
        switch self {
        case .ksto: URL(string: "https://www.kstoradio.org/")!
        case .krlx: URL(string: "https://www.krlx.org/")!
        }
    }

    var nowPlayingFeed: NowPlayingFeed {
        switch self {
        case .ksto: .showSchedule(URL(string: "https://stolaf.dev/AAO-React-Native/ksto-schedule.json")!)
        case .krlx: .metaradio(URL(string: "https://content.krlx.org/wp-json/metaradio/v1/stationnow/?station=1")!)
        }
    }

    /// The asset catalog image that stands in for missing artwork.
    var logoImageName: String { rawValue }
}
