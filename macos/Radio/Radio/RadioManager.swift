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

    private static let selectedStationKey = "selectedStation"
    private static let scheduleLifetime: TimeInterval = 60 * 60
    private static let showCheckInterval = Duration.seconds(60)

    var isPlaying = false
    /// Whether the stream is still loading after Play.
    private(set) var isBuffering = false
    var volume: Float = 0.5 {
        didSet { player?.volume = volume }
    }

    /// The station last chosen, kept across launches.
    var selectedStation: Station = Station(rawValue: UserDefaults.standard.string(forKey: RadioManager.selectedStationKey) ?? "") ?? .ksto {
        didSet { UserDefaults.standard.set(selectedStation.rawValue, forKey: Self.selectedStationKey) }
    }

    private(set) var nowPlaying: NowPlaying

    init() {
        nowPlaying = NowPlaying(song: nil, show: nil, station: .ksto)
        trackNowPlaying()
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
        trackNowPlaying()
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

    /// Follows what is on air at the selected station until it changes.
    private func trackNowPlaying() {
        nowPlayingTask?.cancel()
        let station = selectedStation
        nowPlaying = NowPlaying(song: nil, show: nil, station: station)
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
            let show = schedules[station]?.schedule.show(at: .now)
            self.show(NowPlaying(song: nil, show: show, station: station), for: station)
            return Self.showCheckInterval
        }
    }

    /// Shows `nowPlaying` unless the station was switched while it was fetched.
    private func show(_ nowPlaying: NowPlaying, for station: Station) {
        guard station == selectedStation, nowPlaying != self.nowPlaying else { return }
        self.nowPlaying = nowPlaying
    }

    private func fetch(_ url: URL) async -> Data? {
        try? await URLSession.shared.data(from: url).0
    }
}
