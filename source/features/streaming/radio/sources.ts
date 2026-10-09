import {
	hasBundledSource,
	REL_RADIO_NOW_PLAYING,
	REL_RADIO_PLAYER_PAGE,
	REL_RADIO_STREAM,
	resolveSource,
	useManifest,
	type Jrd,
	type ResolvedSource,
} from '@frogpond/data-sources'
import {apiUrl} from '../../../lib/api-url'
import type {StationId} from './stations'

/** The streams iOS plays itself: HLS, and the MP3 and AAC an Icecast or Shoutcast server sends. */
export const STREAM_TYPES = ['application/vnd.apple.mpegurl', 'audio/mpeg', 'audio/aac']
/** The station-now feed of the metaradio WordPress plugin, which `parseStationNow` reads. */
export const NOW_PLAYING_TYPE = 'application/vnd.metaradio.stationnow+json'
export const PLAYER_PAGE_TYPE = 'text/html'

/**
 * Where a player page may be, over HTTPS only. The page runs unseen, with its
 * media allowed to start by itself, so a published page elsewhere, or one a
 * network could swap in transit, is not loaded: the station keeps its shipped
 * page instead.
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
	 * HTTPS URL, on one of `PLAYER_PAGE_HOSTS`.
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

/** Where a source is: its address, and the campus whose server a relative one names. */
export type SourceAddress = Pick<ResolvedSource, 'href' | 'campus'>

/**
 * A source a station may not have. One the app ships with is resolved as any
 * other, so a missing or unreadable published entry falls back to the shipped
 * one and a station cannot lose its player page to an edit of the manifest;
 * and a shipped entry this build cannot use throws, as `resolveSource` does,
 * rather than quietly dropping the source. One the app does not ship with is
 * whatever the published manifest makes of it, or nothing.
 */
function optionalSource(
	manifest: Jrd,
	rel: string,
	id: StationId,
	types: readonly string[],
): SourceAddress | undefined {
	if (hasBundledSource(rel, id)) {
		return resolveSource(manifest, rel, id, types)
	}
	try {
		return resolveSource(manifest, rel, id, types)
	} catch {
		return undefined
	}
}

/**
 * `href` as an absolute URL, or undefined if it is not one: the manifest's
 * schema accepts addresses `URL` cannot read, such as a port past 65535, and
 * one of those must not fail the render the radio is drawn in.
 */
function absoluteUrl(source: SourceAddress): string | undefined {
	try {
		return apiUrl(source.campus, source.href)
	} catch {
		return undefined
	}
}

/** `stationId`'s stream as `manifest` names it, or its shipped one if that is not a URL. */
function streamUrl(manifest: Jrd, stationId: StationId): string {
	let source = resolveSource(manifest, REL_RADIO_STREAM, stationId, STREAM_TYPES)
	let shipped = resolveSource(SHIPPED, REL_RADIO_STREAM, stationId, STREAM_TYPES)
	return absoluteUrl(source) ?? apiUrl(shipped.campus, shipped.href)
}

/** Whether `url` is somewhere a player page may be loaded from. */
function isPlayerPageUrl(url: string): boolean {
	let {protocol, host} = new URL(url)
	return protocol === 'https:' && PLAYER_PAGE_HOSTS.includes(host)
}

/**
 * `stationId`'s player page as `manifest` names it, or its shipped one if that
 * is not a URL or not somewhere a page may be.
 */
function playerPageUrl(manifest: Jrd, stationId: StationId): string | undefined {
	let source = optionalSource(manifest, REL_RADIO_PLAYER_PAGE, stationId, [PLAYER_PAGE_TYPE])
	if (source === undefined) {
		return undefined
	}
	let url = absoluteUrl(source)
	if (url !== undefined && isPlayerPageUrl(url)) {
		return url
	}
	let shipped = optionalSource(SHIPPED, REL_RADIO_PLAYER_PAGE, stationId, [PLAYER_PAGE_TYPE])
	return shipped === undefined ? undefined : apiUrl(shipped.campus, shipped.href)
}

/**
 * `stationId`'s sources as `manifest` names them, else as shipped. The stream
 * and the page are made absolute here, since the player and the web view are
 * handed them as they are; a relative one names ccc-server.
 */
export function stationSources(manifest: Jrd, stationId: StationId): StationSources {
	return {
		streamSourceUrl: streamUrl(manifest, stationId),
		embeddedPlayerUrl: playerPageUrl(manifest, stationId),
		nowPlayingUrl: nowPlayingSource(manifest, stationId)?.href,
	}
}

/** `stationId`'s song feed as `manifest` names it, else as shipped. */
function nowPlayingSource(manifest: Jrd, stationId: StationId): SourceAddress | undefined {
	return optionalSource(manifest, REL_RADIO_NOW_PLAYING, stationId, [NOW_PLAYING_TYPE])
}

/** `stationId`'s stream as the app ships it. */
export function shippedStreamUrl(stationId: StationId): string {
	return streamUrl(SHIPPED, stationId)
}

/**
 * `stationId`'s sources from the manifest in the cache, however old, else as
 * shipped; undefined until the saved cache has been read back. See
 * `useManifest`.
 */
export function useStationSources(stationId: StationId): StationSources | undefined {
	let manifest = useManifest()
	return manifest === undefined ? undefined : stationSources(manifest, stationId)
}

/** `stationId`'s song feed, as `useStationSources` would give it, with the server it names. */
export function useNowPlayingSource(stationId: StationId): SourceAddress | undefined {
	let manifest = useManifest()
	return manifest === undefined ? undefined : nowPlayingSource(manifest, stationId)
}
