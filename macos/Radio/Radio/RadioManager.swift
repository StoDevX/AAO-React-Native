import Foundation
import AVFoundation
import Observation

@MainActor
@Observable
class RadioManager {
    private var player: AVPlayer?
    @ObservationIgnored private var playbackObservation: NSKeyValueObservation?
    @ObservationIgnored private var nowPlayingTask: Task<Void, Never>?
    /// Each station's schedule and when it was fetched, as schedules change only between terms.
    @ObservationIgnored private var schedules: [Station: (schedule: ShowSchedule, fetchedAt: Date)] = [:]
    @ObservationIgnored private let preferences: StationPreferences
    @ObservationIgnored private let fetch: @Sendable (URL) async -> Data?

    private static let scheduleLifetime: TimeInterval = 60 * 60
    private static let showCheckInterval = Duration.seconds(60)

    var isPlaying = false {
        didSet { followNowPlayingWhileWanted() }
    }
    /// Whether the player's panel is showing, which the panel itself says.
    var isPanelOpen = false {
        didSet { followNowPlayingWhileWanted() }
    }
    /// Whether the stream is still loading after Play.
    private(set) var isBuffering = false
    /// The selected station's volume, kept for it across launches.
    var volume: Float {
        didSet {
            player?.volume = volume
            preferences.setVolume(volume, for: selectedStation)
        }
    }

    /// The station last chosen, kept across launches.
    var selectedStation: Station {
        didSet { preferences.lastPlayedStation = selectedStation }
    }

    private(set) var nowPlaying: NowPlaying
    /// The selected station's shows today, from the earliest, if it publishes a schedule.
    private(set) var todaysShows: [Airing] = []
    /// The one of today's shows on air now, if any.
    private(set) var showOnAir: Show?

    /// `fetch` answers a feed's URL with its response, or nil if it cannot be had.
    init(
        defaults: UserDefaults = .standard,
        fetch: @escaping @Sendable (URL) async -> Data? = { try? await URLSession.shared.data(from: $0).0 }
    ) {
        let preferences = StationPreferences(defaults: defaults)
        let station = preferences.openingStation
        self.preferences = preferences
        self.fetch = fetch
        selectedStation = station
        volume = preferences.volume(for: station)
        nowPlaying = NowPlaying(song: nil, show: nil, station: station)
    }

    func togglePlayPause() {
        if isPlaying {
            // A live stream resumed from a pause plays from where it stopped, so
            // drop it and start from the live edge on the next Play.
            player?.pause()
            player?.replaceCurrentItem(with: nil)
            isPlaying = false
        } else {
            setupAndPlay()
        }
    }

    func switchStation(to station: Station) {
        guard station != selectedStation else { return }
        selectedStation = station
        volume = preferences.volume(for: station)
        stopTrackingNowPlaying()
        followNowPlayingWhileWanted()
        if isPlaying {
            setupAndPlay()
        }
    }

    private func setupAndPlay() {
        let playerItem = AVPlayerItem(url: selectedStation.streamURL)
        if let player {
            player.replaceCurrentItem(with: playerItem)
        } else {
            let player = AVPlayer(playerItem: playerItem)
            playbackObservation = player.observe(\.timeControlStatus, options: [.initial, .new]) { @Sendable [weak self] player, _ in
                guard let self else { return }
                let isWaiting = player.timeControlStatus == .waitingToPlayAtSpecifiedRate
                Task { @MainActor in self.isBuffering = isWaiting }
            }
            self.player = player
        }

        player?.volume = volume
        player?.play()
        isPlaying = true
    }

    // MARK: Now playing

    /// Asks the feeds what is on air only while there is somewhere to show it:
    /// the panel while it is open, and the menu bar's title while playing.
    private func followNowPlayingWhileWanted() {
        if isPlaying || isPanelOpen {
            if nowPlayingTask == nil { trackNowPlaying() }
        } else {
            stopTrackingNowPlaying()
        }
    }

    /// Shows the selected station alone, as what was on air goes stale unwatched.
    private func stopTrackingNowPlaying() {
        nowPlayingTask?.cancel()
        nowPlayingTask = nil
        nowPlaying = NowPlaying(song: nil, show: nil, station: selectedStation)
        todaysShows = []
        showOnAir = nil
    }

    /// Follows what is on air at the selected station until told to stop.
    private func trackNowPlaying() {
        let station = selectedStation
        nowPlayingTask = Task { [weak self] in
            while !Task.isCancelled {
                guard let wait = await self?.refreshNowPlaying(for: station) else { return }
                try? await Task.sleep(for: wait)
            }
        }
    }

    /// Updates what is on air at `station`, and returns how long to wait before asking again.
    private func refreshNowPlaying(for station: Station) async -> Duration {
        switch station.nowPlayingFeed {
        case .metaradio(let url):
            let now = await fetch(url).map(StationNow.parse) ?? StationNow(song: nil, refreshInterval: Self.showCheckInterval)
            show(NowPlaying(song: now.song, show: nil, station: station), for: station)
            return now.refreshInterval
        case .showSchedule(let url):
            if Date.now.timeIntervalSince(schedules[station]?.fetchedAt ?? .distantPast) > Self.scheduleLifetime,
               let schedule = await fetch(url).flatMap(ShowSchedule.parse) {
                schedules[station] = (schedule, .now)
            }
            let schedule = schedules[station]?.schedule
            let show = schedule?.show(at: .now)
            self.show(NowPlaying(song: nil, show: show, station: station), for: station)
            self.show(todaysShows: schedule?.airings(on: .now) ?? [], onAir: show, for: station)
            return Self.showCheckInterval
        }
    }

    /// Whether what was fetched for `station` is still wanted: the station was
    /// not switched, nor the asking stopped, in the meantime.
    private func isStillFollowing(_ station: Station) -> Bool {
        !Task.isCancelled && station == selectedStation
    }

    private func show(_ nowPlaying: NowPlaying, for station: Station) {
        guard isStillFollowing(station), nowPlaying != self.nowPlaying else { return }
        self.nowPlaying = nowPlaying
    }

    private func show(todaysShows: [Airing], onAir: Show?, for station: Station) {
        guard isStillFollowing(station) else { return }
        if todaysShows != self.todaysShows { self.todaysShows = todaysShows }
        if onAir != showOnAir { showOnAir = onAir }
    }
}
