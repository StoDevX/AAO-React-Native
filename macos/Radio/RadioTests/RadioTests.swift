import AppKit
import Testing
@testable import Radio

/// A `stationnow` response shaped like krlx.org's, trimmed to the fields read.
private func stationNowJSON(title: String = "Curses", artist: String = "The Crane Wives", artwork: String? = "https://example.com/600x600bb.jpg", refreshSecs: String = "131") -> Data {
    let links = artwork.map { #"{"artwork_600": "\#($0)"}"# } ?? "{}"
    return Data(#"""
    {"now": {"title": "\#(title)", "artist": "\#(artist)", "links": \#(links)}, "refreshSecs": \#(refreshSecs)}
    """#.utf8)
}

struct StationNowTests {
    @Test func readsTheSongOnAir() {
        let now = StationNow.parse(stationNowJSON())
        #expect(now.song == Song(title: "Curses", artist: "The Crane Wives", artworkURL: URL(string: "https://example.com/600x600bb.jpg")))
    }

    @Test func trimsTextAndDropsAnEmptyArtist() {
        let now = StationNow.parse(stationNowJSON(title: "  Curses ", artist: " "))
        #expect(now.song?.title == "Curses")
        #expect(now.song?.artist == nil)
    }

    @Test func aSongWithoutArtworkHasNoArtworkURL() {
        #expect(StationNow.parse(stationNowJSON(artwork: nil)).song?.artworkURL == nil)
    }

    @Test func aBlankTitleIsNoSong() {
        #expect(StationNow.parse(stationNowJSON(title: " ")).song == nil)
    }

    @Test func asksAgainFifteenSecondsBeforeTheSongShouldEnd() {
        #expect(StationNow.parse(stationNowJSON(refreshSecs: "131")).refreshInterval == .seconds(116))
    }

    @Test func asksEveryFiveSecondsNearTheEndOfASong() {
        #expect(StationNow.parse(stationNowJSON(refreshSecs: "20")).refreshInterval == .seconds(5))
    }

    @Test func asksEveryFifteenSecondsWithNoSongNearTheEnd() {
        #expect(StationNow.parse(stationNowJSON(title: "", refreshSecs: "20")).refreshInterval == .seconds(15))
    }

    @Test func asksInAMinuteWithoutRefreshSecs() {
        #expect(StationNow.parse(stationNowJSON(refreshSecs: #""soon""#)).refreshInterval == .seconds(60))
    }

    @Test func aResponseThatIsNotTheFeedIsNoSong() {
        let now = StationNow.parse(Data("<html>".utf8))
        #expect(now == StationNow(song: nil, refreshInterval: .seconds(60)))
    }
}

/// KSTO's published schedule, trimmed to a few Monday shows.
private let scheduleJSON = Data(#"""
{"data": {"updated": "2026-03-22T16:24:01Z", "timezone": "America/Chicago", "shows": [
    {"day": "monday", "start": "16:00", "end": "17:00", "title": "LIGHTS OUT with Ella", "poster": "https://example.com/image-1.jpg"},
    {"day": "monday", "start": "17:00", "end": "18:00", "title": "Me and Nobody!"},
    {"day": "monday", "start": "23:00", "end": "24:00", "title": "Late Show", "poster": "https://example.com/poster.pdf"}
]}}
"""#.utf8)

/// A moment given in UTC, so the tests do not depend on the machine's time zone.
private func utc(_ text: String) -> Date {
    ISO8601DateFormatter().date(from: text)!
}

struct ShowScheduleTests {
    let schedule = ShowSchedule.parse(scheduleJSON)

    @Test func readsThePublishedSchedule() {
        #expect(schedule?.shows.count == 3)
    }

    @Test func findsTheShowOnAirInStationTime() {
        // 2026-10-05 is a Monday; 21:30 UTC is 16:30 in Northfield.
        #expect(schedule?.show(at: utc("2026-10-05T21:30:00Z"))?.title == "LIGHTS OUT with Ella")
    }

    @Test func aShowEndsAsTheNextBegins() {
        #expect(schedule?.show(at: utc("2026-10-05T22:00:00Z"))?.title == "Me and Nobody!")
    }

    @Test func noShowBetweenSlots() {
        #expect(schedule?.show(at: utc("2026-10-05T23:30:00Z")) == nil)
    }

    @Test func aSlotEndingAt2400RunsToMidnight() {
        #expect(schedule?.show(at: utc("2026-10-06T04:59:00Z"))?.title == "Late Show")
        #expect(schedule?.show(at: utc("2026-10-06T05:00:00Z")) == nil)
    }

    @Test func aResponseThatIsNotTheScheduleIsNil() {
        #expect(ShowSchedule.parse(Data("{}".utf8)) == nil)
    }
}

struct NowPlayingTests {
    let song = Song(title: "Curses", artist: "The Crane Wives", artworkURL: URL(string: "https://example.com/cover.jpg"))

    @Test func showsTheSongWithItsCover() {
        let nowPlaying = NowPlaying(song: song, show: nil, station: .krlx)
        #expect(nowPlaying == NowPlaying(title: "Curses", artist: "The Crane Wives", artworkURL: URL(string: "https://example.com/cover.jpg")))
    }

    @Test func showsTheShowWithItsPosterWhenThereIsNoSong() {
        let show = Show(day: "monday", start: "16:00", end: "17:00", title: "LIGHTS OUT with Ella", poster: URL(string: "https://example.com/image-1.jpg"))
        let nowPlaying = NowPlaying(song: nil, show: show, station: .ksto)
        #expect(nowPlaying == NowPlaying(title: "LIGHTS OUT with Ella", artist: nil, artworkURL: URL(string: "https://example.com/image-1.jpg")))
    }

    @Test func aPosterThatIsNotAnImageIsNotArtwork() {
        let show = Show(day: "monday", start: "23:00", end: "24:00", title: "Late Show", poster: URL(string: "https://example.com/poster.pdf"))
        #expect(NowPlaying(song: nil, show: show, station: .ksto).artworkURL == nil)
    }

    @Test func showsTheStationWithNothingOnAir() {
        let nowPlaying = NowPlaying(song: nil, show: nil, station: .ksto)
        #expect(nowPlaying == NowPlaying(title: "St. Olaf College Radio", artist: nil, artworkURL: nil))
    }
}

/// The space above and below the ink in `columns` of `image`, drawn at 2x.
@MainActor
private func inkGaps(in image: NSImage, columns: Range<CGFloat>) -> (above: Int, below: Int) {
    let scale: CGFloat = 2
    let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(image.size.width * scale), pixelsHigh: Int(image.size.height * scale), bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
    rep.size = image.size
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
    image.draw(in: NSRect(origin: .zero, size: image.size))
    NSGraphicsContext.restoreGraphicsState()
    // Bitmap rows count down from the top.
    let inkRows = (0..<rep.pixelsHigh).filter { y in
        (Int(columns.lowerBound * scale)..<Int(columns.upperBound * scale)).contains { x in
            (rep.colorAt(x: x, y: y)?.alphaComponent ?? 0) > 0.5
        }
    }
    return (inkRows.first ?? -1, rep.pixelsHigh - 1 - (inkRows.last ?? -1))
}

@MainActor
struct MenuBarLabelTests {
    @Test func theIconAloneIsCenteredOnTheBar() {
        let image = MenuBarLabel.image(title: "")
        #expect(image.size.height == MenuBarLabel.height)
        let gaps = inkGaps(in: image, columns: 0..<image.size.width)
        #expect(abs(gaps.above - gaps.below) <= 1, "ink gaps \(gaps)")
    }

    @Test func theIconBesideATitleIsCenteredOnTheBar() {
        let image = MenuBarLabel.image(title: "HH")
        let gaps = inkGaps(in: image, columns: 0..<MenuBarLabel.iconWidth)
        #expect(abs(gaps.above - gaps.below) <= 1, "ink gaps \(gaps)")
    }

    @Test func aTitlesCapitalsAreCenteredOnTheBar() {
        // Capitals without descenders, so their ink is exactly the cap height.
        let image = MenuBarLabel.image(title: "HH")
        let gaps = inkGaps(in: image, columns: MenuBarLabel.iconWidth..<image.size.width)
        #expect(abs(gaps.above - gaps.below) <= 1, "ink gaps \(gaps)")
    }

    @Test func aTitleWidensTheItem() {
        #expect(MenuBarLabel.image(title: "HH").size.width > MenuBarLabel.image(title: "").size.width)
    }

    @Test func isATemplateSoTheMenuBarTintsIt() {
        #expect(MenuBarLabel.image(title: "").isTemplate)
    }
}
