import type {Station} from './stations'
import type {RadioLogo} from './theme'

/** A song on the air. */
export type Song = {
	title: string
	artist: string | null
	/** The song's cover, where the feed has one. */
	artworkUri: string | null
}

/** The song now on air, if any, and how long to wait before asking again. */
export type StationNow = {song: Song | null; refreshMs: number}

/**
 * How long to wait before asking again is the feed's own `refreshSecs`. It
 * counts down to the end of the song on air: read at 13:29:47 GMT, with a
 * 247-second song begun at 13:28:01, it said 144, which is the 141 seconds left
 * and a few more. So the next song is there to be had when it says. The plugin's
 * own script never asks more often than every 15 seconds, so neither does the
 * app; and with no say, it asks in a minute.
 */
const MIN_REFRESH_MS = 15_000
const DEFAULT_REFRESH_MS = 60_000

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** The text of `value` with its edges trimmed, or null if it is not text or is empty. */
function text(value: unknown): string | null {
	if (typeof value !== 'string') {
		return null
	}
	let trimmed = value.trim()
	return trimmed === '' ? null : trimmed
}

/**
 * Reads a `metaradio` `stationnow` response, which is the plugin krlx.org's
 * own player uses. A song needs a title and nothing else; it is not shown at
 * all if the response is not what the plugin sends.
 */
export function parseStationNow(json: unknown): StationNow {
	if (!isRecord(json)) {
		return {song: null, refreshMs: DEFAULT_REFRESH_MS}
	}
	let refreshSecs = json.refreshSecs
	let refreshMs =
		typeof refreshSecs === 'number' && Number.isFinite(refreshSecs)
			? Math.max(refreshSecs * 1000, MIN_REFRESH_MS)
			: DEFAULT_REFRESH_MS

	let now = json.now
	let title = isRecord(now) ? text(now.title) : null
	if (!isRecord(now) || title === null) {
		return {song: null, refreshMs}
	}
	let links = isRecord(now.links) ? now.links : {}
	return {
		song: {title, artist: text(now.artist), artworkUri: text(links.artwork_600)},
		refreshMs,
	}
}

/** What Control Center, the bar and the sheet show for a station. */
export type NowPlayingPresentation = {
	title: string
	artist?: string
	albumTitle?: string
	artworkUri: string
	/** Whether this is a song, not the station standing in for one. */
	isSong: boolean
}

/**
 * The song when there is one, with its own cover where it has one and the
 * station's logo where it does not; the station's name and logo when there is
 * no song to show.
 */
export function presentNowPlaying(
	song: Song | null,
	station: Station,
	logo: RadioLogo,
): NowPlayingPresentation {
	if (song === null) {
		return {title: station.stationName, artworkUri: logo.image.uri, isSong: false}
	}
	return {
		title: song.title,
		...(song.artist === null ? {} : {artist: song.artist}),
		albumTitle: station.stationName,
		artworkUri: song.artworkUri ?? logo.image.uri,
		isSong: true,
	}
}
