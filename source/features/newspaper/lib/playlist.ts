import type {Block, SpotifyRef} from '../types'
import {findSpotifyRef, spotifyRefOf} from './spotify'

/** Whether an address names this very playlist, album or track. */
function names(url: string, spotify: SpotifyRef): boolean {
	let ref = spotifyRefOf(url)
	return ref?.kind === spotify.kind && ref.id === spotify.id
}

/**
 * A Playlist post's Spotify reference, from its raw HTML, and the body left once the block
 * that held it is taken out: the embed player, or the paragraph holding only the link. Any
 * other block, such as the writer's note, stays. A body with no reference gives null, and
 * the reader looks for one on the post's web page.
 */
export function parsePlaylist(
	html: string,
	blocks: Block[],
): {spotify: SpotifyRef | null; blocks: Block[]} {
	let spotify = findSpotifyRef(html)
	if (!spotify) return {spotify: null, blocks}
	return {
		spotify,
		blocks: blocks.filter((block) => {
			if (block.type === 'embed') return !names(block.url, spotify)
			if (block.type === 'paragraph') {
				return !names(block.runs.map((run) => run.text).join(''), spotify)
			}
			return true
		}),
	}
}
