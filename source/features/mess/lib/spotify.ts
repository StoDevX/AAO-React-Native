import {isTag, isText, parseHtml, type ChildNode} from '@frogpond/html-lib'
import type {SpotifyRef} from '../types'
import {SKIPPED} from './blocks'

/** What the reader can open and play; an artist or a podcast is none of these. */
const KINDS: ReadonlyArray<SpotifyRef['kind']> = ['playlist', 'album', 'track']

/**
 * A Spotify address, as a link or as its embed player. A link shared in some countries
 * carries a region first, such as `intl-de/`.
 */
const ADDRESS = String.raw`https?://open\.spotify\.com/(?:intl-[a-z-]+/)?(?:embed/)?([a-z]+)/([A-Za-z0-9]+)`
/** An address and nothing else, with any query or fragment after the id. */
const WHOLE_ADDRESS = new RegExp(`^${ADDRESS}(?:[/?#]\\S*)?$`, 'u')
/** Every address in a stretch of text. */
const ADDRESSES = new RegExp(ADDRESS, 'gu')

/** The reference in a match, when its kind is one the reader plays. */
function refOf(match: RegExpMatchArray | null): SpotifyRef | null {
	let kind = KINDS.find((k) => k === match?.[1])
	let id = match?.[2]
	return kind && id ? {kind, id} : null
}

/**
 * The playlist, album or track a Spotify address names, when the string is that address and
 * nothing more. An older `/user/<name>/playlist/<id>` address names none.
 */
export function spotifyRefOf(url: string): SpotifyRef | null {
	return refOf(WHOLE_ADDRESS.exec(url.trim()))
}

/** The first playable reference among the Spotify addresses in some text. */
function refIn(text: string): SpotifyRef | null {
	for (let match of text.matchAll(ADDRESSES)) {
		let ref = refOf(match)
		if (ref) return ref
	}
	return null
}

/**
 * The first Spotify playlist, album or track in an HTML document, in reading order: an
 * iframe's player, or an address in the text. It reads a post's body and a post's web page
 * alike.
 */
export function findSpotifyRef(html: string): SpotifyRef | null {
	// An explicit stack rather than recursion: a web page's markup is deep and uncontrolled.
	let stack: ChildNode[] = [...parseHtml(html).children].reverse()
	for (let node = stack.pop(); node !== undefined; node = stack.pop()) {
		if (isText(node)) {
			let ref = refIn(node.data)
			if (ref) return ref
			continue
		}
		if (!isTag(node) || SKIPPED.has(node.name)) continue
		if (node.name === 'iframe') {
			let ref = spotifyRefOf(node.attribs.src ?? '')
			if (ref) return ref
			continue
		}
		// Pushed in reverse so they pop back off in document order.
		for (let child of [...node.children].reverse()) stack.push(child)
	}
	return null
}

/** The link that opens a reference in Spotify: the app when it is installed, else the web player. */
export function spotifyUrl(ref: SpotifyRef): string {
	return `https://open.spotify.com/${ref.kind}/${ref.id}`
}

/** The address of Spotify's embed player for a reference. */
export function spotifyEmbedUrl(ref: SpotifyRef): string {
	return `https://open.spotify.com/embed/${ref.kind}/${ref.id}`
}

/** Where Spotify's embed player lives; its own pages load in it, whatever their query. */
const PLAYER = 'https://open.spotify.com/embed/'

/**
 * Whether a load the embed player asks for stays in it. A frame inside the player, and the
 * player's own pages, stay; any other page is one the reader is leaving for, such as a
 * track's link or "Open in Spotify", and goes to the browser or the app instead.
 */
export function loadsInPlayer(request: {url: string; isTopFrame: boolean}): boolean {
	return !request.isTopFrame || request.url === 'about:blank' || request.url.startsWith(PLAYER)
}
