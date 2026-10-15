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

    var websiteURL: URL {
        switch self {
        case .ksto: URL(string: "https://www.kstoradio.org/")!
        case .krlx: URL(string: "https://www.krlx.org/")!
        }
    }

    /// KSTO's published weekly schedule. A station's song feed, and its stream,
    /// come from the sources manifest; see `StationSourcesStore`.
    var showScheduleURL: URL? {
        switch self {
        case .ksto: URL(string: "https://stolaf.dev/AAO-React-Native/ksto-schedule.json")!
        case .krlx: nil
        }
    }

    /// The asset catalog image that stands in for missing artwork.
    var logoImageName: String { rawValue }
}
