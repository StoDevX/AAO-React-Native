import {logoImage, type Station} from './stations'
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
 * When to ask again follows the feed's `refreshSecs`, which counts down to about
 * the end of the song on air. Measured on krlx.org, 2026-10-03:
 *
 * - Sampled over 143 seconds it fell from 233 to 101 while the song had 243 and
 *   then 100 left: within about 10 seconds of the time left, mostly a few under.
 * - It does not fall smoothly. It steps about every 10 seconds, as the server
 *   caches the answer for 10, so asking more often than every 5 seconds gains
 *   nothing; and near the end it holds at 8 or 9 rather than reaching 0.
 * - The feed named the next song about 3 seconds after it began, and the next
 *   song began about 7 seconds after the last one's start plus duration.
 *
 * So while a song has a way to go, the next ask is 15 seconds before it should
 * end; and from the last 30 seconds, with a song on air, it asks every 5 until
 * the song changes. That keeps the song on the lock screen within a few seconds
 * of the feed's, at about seven asks per song change. With no song on air it
 * asks no more often than the plugin's own script does, every 15 seconds. With
 * no say from the feed, it asks in a minute. If a song change ever shows late,
 * measure the feed again.
 */
const APPROACH_SECS = 15
const NEAR_END_SECS = 30
const NEAR_END_MS = 5_000
const MIN_REFRESH_MS = 15_000
const DEFAULT_REFRESH_MS = 60_000

/** How long to wait before asking again, given the feed's `refreshSecs`. */
function nextAskMs(refreshSecs: unknown, songOnAir: boolean): number {
	if (typeof refreshSecs !== 'number' || !Number.isFinite(refreshSecs)) {
		return DEFAULT_REFRESH_MS
	}
	if (refreshSecs > NEAR_END_SECS) {
		return (refreshSecs - APPROACH_SECS) * 1000
	}
	return songOnAir ? NEAR_END_MS : MIN_REFRESH_MS
}

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
	let now = json.now
	let title = isRecord(now) ? text(now.title) : null
	if (!isRecord(now) || title === null) {
		return {song: null, refreshMs: nextAskMs(json.refreshSecs, false)}
	}
	let links = isRecord(now.links) ? now.links : {}
	return {
		song: {title, artist: text(now.artist), artworkUri: text(links.artwork_600)},
		refreshMs: nextAskMs(json.refreshSecs, true),
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
 * station's logo where it does not. With no song, the show on air under the
 * station's name if the schedule has one; otherwise the station's name and logo.
 */
export function presentNowPlaying(
	song: Song | null,
	station: Station,
	logo: RadioLogo,
	show: {title: string} | null = null,
): NowPlayingPresentation {
	if (song === null) {
		return show === null
			? {title: station.stationName, artworkUri: logoImage(logo).uri, isSong: false}
			: {
					title: show.title,
					artist: station.stationName,
					artworkUri: logoImage(logo).uri,
					isSong: false,
				}
	}
	return {
		title: song.title,
		...(song.artist === null ? {} : {artist: song.artist}),
		albumTitle: station.stationName,
		artworkUri: song.artworkUri ?? logoImage(logo).uri,
		isSong: true,
	}
}
