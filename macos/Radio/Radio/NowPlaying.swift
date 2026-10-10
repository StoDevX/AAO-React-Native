import Foundation

/// A song on the air.
nonisolated struct Song: Equatable, Sendable {
    let title: String
    let artist: String?
    /// The song's cover, where the feed has one.
    let artworkURL: URL?
}

/// The song now on air, if any, and how long to wait before asking again.
nonisolated struct StationNow: Equatable, Sendable {
    let song: Song?
    let refreshInterval: Duration

    /*
     When to ask again follows the feed's `refreshSecs`, which counts down to
     about the end of the song on air, but in steps of about 10 seconds as the
     server caches its answer. These are the main app's numbers, measured on
     krlx.org (see source/features/streaming/radio/now-playing.ts): while a song
     has a way to go, ask 15 seconds before it should end; in its last 30 seconds
     ask every 5 until it changes; with no song, every 15; with no say from the
     feed, in a minute.
     */
    private static let approachSecs = 15.0
    private static let nearEndSecs = 30.0
    private static let nearEndInterval = Duration.seconds(5)
    private static let minimumInterval = Duration.seconds(15)
    private static let defaultInterval = Duration.seconds(60)

    private static func nextAsk(refreshSecs: Any?, songOnAir: Bool) -> Duration {
        guard let refreshSecs = refreshSecs as? Double, refreshSecs.isFinite else {
            return defaultInterval
        }
        if refreshSecs > nearEndSecs {
            return .seconds(refreshSecs - approachSecs)
        }
        return songOnAir ? nearEndInterval : minimumInterval
    }

    /// The text of `value` with its edges trimmed, or nil if it is not text or is empty.
    private static func text(_ value: Any?) -> String? {
        guard let value = value as? String else { return nil }
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }

    /// Reads a `metaradio` `stationnow` response. A song needs a title and
    /// nothing else; there is no song if the response is not what the plugin sends.
    static func parse(_ data: Data) -> StationNow {
        guard let json = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] else {
            return StationNow(song: nil, refreshInterval: defaultInterval)
        }
        guard let now = json["now"] as? [String: Any], let title = text(now["title"]) else {
            return StationNow(song: nil, refreshInterval: nextAsk(refreshSecs: json["refreshSecs"], songOnAir: false))
        }
        let links = now["links"] as? [String: Any] ?? [:]
        let song = Song(title: title, artist: text(now["artist"]), artworkURL: text(links["artwork_600"]).flatMap(URL.init(string:)))
        return StationNow(song: song, refreshInterval: nextAsk(refreshSecs: json["refreshSecs"], songOnAir: true))
    }
}

/// One weekly slot in a station's schedule.
nonisolated struct Show: Decodable, Equatable, Sendable {
    /// A lowercase English weekday, such as "monday".
    let day: String
    /// "HH:00" in the schedule's time zone.
    let start: String
    /// "HH:00", or "24:00" for the end of the slot's own day.
    let end: String
    let title: String
    let poster: URL?
}

/// A station's weekly show schedule, as data/_schemas/ksto-schedule.yaml describes it.
nonisolated struct ShowSchedule: Decodable, Sendable {
    let timezone: String
    let shows: [Show]

    private struct Envelope: Decodable {
        let data: ShowSchedule
    }

    /// Reads the published schedule, or nil if the response is not one.
    static func parse(_ data: Data) -> ShowSchedule? {
        try? JSONDecoder().decode(Envelope.self, from: data).data
    }

    private static let weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]

    /// Minutes since midnight for "HH:MM", so "24:00" is the day's last moment.
    private static func minutes(_ clock: String) -> Int? {
        let parts = clock.split(separator: ":").compactMap { Int($0) }
        guard parts.count == 2 else { return nil }
        return parts[0] * 60 + parts[1]
    }

    /// The show on air at `date` in the schedule's own time zone, if any.
    func show(at date: Date) -> Show? {
        guard let timeZone = TimeZone(identifier: timezone) else { return nil }
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = timeZone
        let parts = calendar.dateComponents([.weekday, .hour, .minute], from: date)
        guard let weekday = parts.weekday, let hour = parts.hour, let minute = parts.minute else { return nil }
        let day = Self.weekdays[weekday - 1]
        let now = hour * 60 + minute
        return shows.first { show in
            guard show.day == day, let start = Self.minutes(show.start), let end = Self.minutes(show.end) else {
                return false
            }
            return start <= now && now < end
        }
    }
}

/// What the player shows for a station.
nonisolated struct NowPlaying: Equatable, Sendable {
    let title: String
    let artist: String?
    /// Nil when the player should show the station's logo.
    let artworkURL: URL?

    /// Posters are sometimes PDFs, which an image view cannot draw.
    private static let imageExtensions: Set<String> = ["jpg", "jpeg", "png", "gif", "webp", "heic"]

    init(title: String, artist: String?, artworkURL: URL?) {
        self.title = title
        self.artist = artist
        self.artworkURL = artworkURL
    }

    /// The song when there is one, with its cover; otherwise the show on air
    /// with its poster; otherwise the station itself.
    init(song: Song?, show: Show?, station: Station) {
        if let song {
            self.init(title: song.title, artist: song.artist, artworkURL: song.artworkURL)
        } else if let show {
            let poster = show.poster.flatMap { Self.imageExtensions.contains($0.pathExtension.lowercased()) ? $0 : nil }
            self.init(title: show.title, artist: nil, artworkURL: poster)
        } else {
            self.init(title: station.tagline, artist: nil, artworkURL: nil)
        }
    }
}
