import {useIsRestoring, useQuery} from '@tanstack/react-query'
import {
	manifestOptions,
	REL_RADIO_NOW_PLAYING,
	REL_RADIO_PLAYER_PAGE,
	REL_RADIO_STREAM,
	resolveSource,
	type Jrd,
} from '@frogpond/data-sources'
import {apiUrl} from '../../../lib/api-url'
import type {StationId} from './stations'

/** The streams iOS plays itself: HLS, and the MP3 and AAC an Icecast or Shoutcast server sends. */
export const STREAM_TYPES = ['application/vnd.apple.mpegurl', 'audio/mpeg', 'audio/aac']
/** The station-now feed of the metaradio WordPress plugin, which `parseStationNow` reads. */
export const NOW_PLAYING_TYPE = 'application/vnd.metaradio.stationnow+json'
export const PLAYER_PAGE_TYPE = 'text/html'

/**
 * Where a player page may be. The page runs unseen, with its media allowed to
 * start by itself, so a published page elsewhere is not loaded: the station
 * keeps its shipped page instead.
 */
const PLAYER_PAGE_HOSTS: readonly string[] = ['www.stolaf.edu']

/** Where a station's audio, and what is on it, come from. The addresses live in `data/sources.yaml`. */
export type StationSources = {
	/** The stream the app plays itself, so that Control Center and AirPlay see it. An absolute URL. */
	streamSourceUrl: string
	/**
	 * The station's own player page, for a station whose owner wants it loaded
	 * so that its analytics keep counting listens. The app loads it with its
	 * sound off, beside the stream it plays itself. See `MutedStationPage` and
	 * `RadioHost`, and the DECISION beside KSTO's entries in the manifest. An
	 * absolute URL, on one of `PLAYER_PAGE_HOSTS`.
	 */
	embeddedPlayerUrl?: string
	/**
	 * Where the song now on air is published, for a station that does. Relative
	 * when ccc-server proxies it, so it is fetched with `fetchSourceBody`.
	 */
	nowPlayingUrl?: string
}

/** Resolving against a manifest with no links gives the shipped entries. */
const SHIPPED: Jrd = {subject: '', links: []}

/**
 * A source a station may not have. A missing or unreadable published entry
 * still falls back to the shipped one, so a station that ships with a player
 * page cannot lose it to an edit of the manifest.
 */
function optionalHref(
	manifest: Jrd,
	rel: string,
	id: StationId,
	types: readonly string[],
): string | undefined {
	try {
		return resolveSource(manifest, rel, id, types).href
	} catch {
		return undefined
	}
}

/** `stationId`'s player page as `manifest` names it, absolute, wherever it is. */
function anyPlayerPageUrl(manifest: Jrd, stationId: StationId): string | undefined {
	let href = optionalHref(manifest, REL_RADIO_PLAYER_PAGE, stationId, [PLAYER_PAGE_TYPE])
	return href === undefined ? undefined : apiUrl(href)
}

/** `stationId`'s player page as `manifest` names it, or its shipped one if that is not on `PLAYER_PAGE_HOSTS`. */
function playerPageUrl(manifest: Jrd, stationId: StationId): string | undefined {
	let url = anyPlayerPageUrl(manifest, stationId)
	if (url === undefined || PLAYER_PAGE_HOSTS.includes(new URL(url).host)) {
		return url
	}
	return anyPlayerPageUrl(SHIPPED, stationId)
}

/**
 * `stationId`'s sources as `manifest` names them, else as shipped. The stream
 * and the page are made absolute here, since the player and the web view are
 * handed them as they are; a relative one names ccc-server.
 */
export function stationSources(manifest: Jrd, stationId: StationId): StationSources {
	return {
		streamSourceUrl: apiUrl(
			resolveSource(manifest, REL_RADIO_STREAM, stationId, STREAM_TYPES).href,
		),
		embeddedPlayerUrl: playerPageUrl(manifest, stationId),
		nowPlayingUrl: optionalHref(manifest, REL_RADIO_NOW_PLAYING, stationId, [NOW_PLAYING_TYPE]),
	}
}

/**
 * `stationId`'s sources from the manifest in the cache, however old, which a
 * fetch refreshes behind it; a failed fetch leaves the cached copy standing.
 * Only with nothing cached at all do the shipped entries stand in. While the
 * saved cache is still being read back there is no telling which it will be,
 * so this is undefined until it has been.
 */
export function useStationSources(stationId: StationId): StationSources | undefined {
	let restoring = useIsRestoring()
	let {data: manifest} = useQuery(manifestOptions)
	if (restoring) {
		return undefined
	}
	return stationSources(manifest ?? SHIPPED, stationId)
}
