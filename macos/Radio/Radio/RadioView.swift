import SwiftUI

/// The menu bar player, laid out like the system's Now Playing controls.
struct RadioView: View {
    @Bindable var manager: RadioManager
    @Environment(\.openSettings) private var openSettings

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            ArtworkView(url: manager.nowPlaying.artworkURL, station: manager.selectedStation)
                .frame(width: 112, height: 112)

            VStack(alignment: .leading, spacing: 8) {
                HStack(alignment: .top) {
                    nowPlayingText
                    Spacer(minLength: 4)
                    optionsMenu
                }

                playPauseButton
                    .frame(maxWidth: .infinity)

                HStack(spacing: 8) {
                    LiveBadge(isOnAir: manager.isPlaying)
                    Image(systemName: "speaker.fill")
                        .foregroundStyle(.secondary)
                    Slider(value: $manager.volume, in: 0...1)
                        .controlSize(.mini)
                        .accessibilityLabel("Volume")
                }
                .font(.caption)
            }
        }
        .padding(12)
        .frame(width: 340)
    }

    private var nowPlayingText: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(manager.nowPlaying.title)
                .font(.headline)
                .lineLimit(1)
                .help(manager.nowPlaying.title)
            if let artist = manager.nowPlaying.artist {
                Text(artist)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
            stationMenu
        }
    }

    /// The station's name, which opens a menu of the other stations.
    private var stationMenu: some View {
        Menu {
            Picker("Station", selection: Binding(
                get: { manager.selectedStation },
                set: { manager.switchStation(to: $0) }
            )) {
                ForEach(Station.allCases) { station in
                    Text(station.name).tag(station)
                }
            }
            .pickerStyle(.inline)
            .labelsHidden()
        } label: {
            HStack(spacing: 3) {
                Text(manager.selectedStation.name)
                Image(systemName: "chevron.down")
                    .font(.caption2.weight(.semibold))
            }
            .foregroundStyle(.secondary)
            .contentShape(.rect)
        }
        .menuStyle(.button)
        .buttonStyle(.plain)
        .menuIndicator(.hidden)
        .fixedSize()
        .accessibilityLabel("Station: \(manager.selectedStation.name)")
    }

    private var playPauseButton: some View {
        Button(action: { manager.togglePlayPause() }) {
            ZStack {
                if manager.isPlaying && manager.isBuffering {
                    ProgressView()
                        .controlSize(.small)
                } else {
                    Image(systemName: manager.isPlaying ? "pause.fill" : "play.fill")
                        .font(.title)
                        .contentTransition(.symbolEffect(.replace))
                }
            }
            .frame(width: 44, height: 36)
            .contentShape(.rect)
        }
        .buttonStyle(.plain)
        .keyboardShortcut(.space, modifiers: [])
        .accessibilityLabel(manager.isPlaying ? "Pause" : "Play")
    }

    private var optionsMenu: some View {
        Menu {
            Button("Settings…") {
                NSApplication.showInDock()
                openSettings()
            }
            .keyboardShortcut(",")
            Button("About \(NSApplication.bundleName)") {
                NSApplication.showAboutPanel()
            }
            Divider()
            Button("Quit") {
                NSApplication.shared.terminate(nil)
            }
            .keyboardShortcut("q")
        } label: {
            Image(systemName: "ellipsis.circle")
                .foregroundStyle(.secondary)
        }
        .menuStyle(.button)
        .buttonStyle(.plain)
        .menuIndicator(.hidden)
        .fixedSize()
        .accessibilityLabel("Options")
    }
}

/// The song's cover or show's poster, or the station's logo when there is neither.
struct ArtworkView: View {
    let url: URL?
    let station: Station

    var body: some View {
        AsyncImage(url: url) { phase in
            if let image = phase.image {
                image
                    .resizable()
                    .scaledToFill()
            } else {
                StationLogo(station: station)
            }
        }
        // A new identity for each URL, so a cover loaded for one station is not
        // kept while showing another's logo or artwork.
        .id(url)
        .clipShape(.rect(cornerRadius: 8))
        .accessibilityHidden(true)
    }
}

struct StationLogo: View {
    let station: Station

    var body: some View {
        Image(station.logoImageName)
            .resizable()
            .scaledToFit()
            .padding(10)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(station.tint)
    }
}

/// Stands in for a progress bar, as a live stream has no position to show.
struct LiveBadge: View {
    let isOnAir: Bool

    var body: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(isOnAir ? Color.red : Color.secondary)
                .frame(width: 6, height: 6)
            Text("LIVE")
                .font(.caption2.weight(.bold))
                .foregroundStyle(isOnAir ? .primary : .secondary)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel(isOnAir ? "Live" : "Not playing")
    }
}

extension Station {
    /// The main app's tints for each station's logo (source/campuses/*/radio.ts).
    var tint: Color {
        switch self {
        case .ksto: Color(red: 0x68 / 255, green: 0x53 / 255, blue: 0x93 / 255)
        case .krlx: Color(red: 0x8a / 255, green: 0x52 / 255, blue: 0x9e / 255)
        }
    }
}

#Preview {
    RadioView(manager: RadioManager())
}
