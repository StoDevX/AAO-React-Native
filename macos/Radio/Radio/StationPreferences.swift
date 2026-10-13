import Foundation

/// Which station the app opens on.
nonisolated enum LaunchStation: Hashable, RawRepresentable, Sendable {
    /// Whichever station was chosen last.
    case lastPlayed
    case station(Station)

    private static let lastPlayedValue = "lastPlayed"

    init?(rawValue: String) {
        if rawValue == Self.lastPlayedValue {
            self = .lastPlayed
        } else if let station = Station(rawValue: rawValue) {
            self = .station(station)
        } else {
            return nil
        }
    }

    var rawValue: String {
        switch self {
        case .lastPlayed: Self.lastPlayedValue
        case .station(let station): station.rawValue
        }
    }
}

/// What the app keeps about its stations across launches.
nonisolated struct StationPreferences {
    static let launchStationKey = "launchStation"
    private static let lastPlayedStationKey = "selectedStation"
    private static let defaultVolume: Float = 0.5

    let defaults: UserDefaults

    /// The station last chosen, or KSTO before any was.
    var lastPlayedStation: Station {
        get { Station(rawValue: defaults.string(forKey: Self.lastPlayedStationKey) ?? "") ?? .ksto }
        nonmutating set { defaults.set(newValue.rawValue, forKey: Self.lastPlayedStationKey) }
    }

    /// The station to open on: the one Settings names, or else the last played.
    var openingStation: Station {
        switch LaunchStation(rawValue: defaults.string(forKey: Self.launchStationKey) ?? "") {
        case .station(let station): station
        case .lastPlayed, nil: lastPlayedStation
        }
    }

    /// Each station keeps its own volume, as their streams are not equally loud.
    func volume(for station: Station) -> Float {
        (defaults.object(forKey: Self.volumeKey(for: station)) as? NSNumber)?.floatValue ?? Self.defaultVolume
    }

    func setVolume(_ volume: Float, for station: Station) {
        defaults.set(volume, forKey: Self.volumeKey(for: station))
    }

    private static func volumeKey(for station: Station) -> String {
        "volume.\(station.rawValue)"
    }
}
