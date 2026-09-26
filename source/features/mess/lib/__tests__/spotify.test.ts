import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {describe, expect, it} from '@jest/globals'
import fixtures from '../../__tests__/fixtures/crossword-playlist-posts.json'
import {findSpotifyRef, loadsInPlayer, spotifyEmbedUrl, spotifyRefOf, spotifyUrl} from '../spotify'

const html = (id: number) => fixtures.find((p) => p.id === id)?.content.rendered ?? ''
const PAGE = readFileSync(
	join(__dirname, '../../__tests__/fixtures/playlist-page-36532.html'),
	'utf8',
)

describe('spotifyRefOf', () => {
	it('reads a playlist link and drops its query string', () => {
		expect(
			spotifyRefOf(
				'https://open.spotify.com/playlist/072f2dzlfGFgJkx9SNXaQz?si=vgY9EsYUTf6FBwFE_UjcPw',
			),
		).toStrictEqual({kind: 'playlist', id: '072f2dzlfGFgJkx9SNXaQz'})
	})

	it('reads an embed player address', () => {
		expect(
			spotifyRefOf(
				'https://open.spotify.com/embed/playlist/7l7eNnU0hgD1beeMK7znYv?si=866a898db1434644&utm_source=oembed',
			),
		).toStrictEqual({kind: 'playlist', id: '7l7eNnU0hgD1beeMK7znYv'})
	})

	// Hand-written: no Playlist post links an album or a track.
	it('reads an album and a track', () => {
		expect(spotifyRefOf('https://open.spotify.com/album/4aawyAB9vmqN3uQ7FjRGTy')).toStrictEqual({
			kind: 'album',
			id: '4aawyAB9vmqN3uQ7FjRGTy',
		})
		expect(
			spotifyRefOf('https://open.spotify.com/embed/track/11dFghVXANMlKmJXsNCbNl'),
		).toStrictEqual({
			kind: 'track',
			id: '11dFghVXANMlKmJXsNCbNl',
		})
	})

	it('takes no artist, and no address from another site', () => {
		expect(spotifyRefOf('https://open.spotify.com/artist/0oSGxfWSnnOXhD2fKuz2Gy')).toBeNull()
		expect(spotifyRefOf('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBeNull()
	})

	// Hand-written: Spotify's share sheet adds a region to the address in some countries.
	it('reads a regional share link', () => {
		expect(
			spotifyRefOf(
				'https://open.spotify.com/intl-de/playlist/072f2dzlfGFgJkx9SNXaQz?si=vgY9EsYUTf6FBwFE_UjcPw',
			),
		).toStrictEqual({kind: 'playlist', id: '072f2dzlfGFgJkx9SNXaQz'})
		expect(
			spotifyRefOf('https://open.spotify.com/intl-pt-br/track/11dFghVXANMlKmJXsNCbNl'),
		).toStrictEqual({
			kind: 'track',
			id: '11dFghVXANMlKmJXsNCbNl',
		})
	})

	it('finds a regional share link in text', () => {
		expect(
			findSpotifyRef('<p>https://open.spotify.com/intl-fr/album/4aawyAB9vmqN3uQ7FjRGTy</p>'),
		).toStrictEqual({kind: 'album', id: '4aawyAB9vmqN3uQ7FjRGTy'})
	})

	it('takes no address with words around it', () => {
		expect(
			spotifyRefOf('Listen: https://open.spotify.com/playlist/072f2dzlfGFgJkx9SNXaQz'),
		).toBeNull()
	})
})

describe('findSpotifyRef', () => {
	it('finds the embed iframe in a body (36843)', () => {
		expect(findSpotifyRef(html(36843))).toStrictEqual({
			kind: 'playlist',
			id: '7l7eNnU0hgD1beeMK7znYv',
		})
	})

	it('finds a bare link in a body (36639)', () => {
		expect(findSpotifyRef(html(36639))).toStrictEqual({
			kind: 'playlist',
			id: '072f2dzlfGFgJkx9SNXaQz',
		})
	})

	it('finds a bare link inside a WordPress embed figure (29321)', () => {
		expect(findSpotifyRef(html(29321))).toStrictEqual({
			kind: 'playlist',
			id: '27hCbBHE86sDY7E4H6Xfjq',
		})
	})

	it('finds nothing in an empty body (36532)', () => {
		expect(findSpotifyRef(html(36532))).toBeNull()
	})

	it('ignores an iframe from another site', () => {
		expect(
			findSpotifyRef(
				'<p><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe></p>' +
					'<p><iframe src="https://open.spotify.com/embed/album/4aawyAB9vmqN3uQ7FjRGTy"></iframe></p>',
			),
		).toStrictEqual({kind: 'album', id: '4aawyAB9vmqN3uQ7FjRGTy'})
	})

	it('finds an address inside a sentence', () => {
		expect(
			findSpotifyRef(
				'<p>Listen along at https://open.spotify.com/track/11dFghVXANMlKmJXsNCbNl today.</p>',
			),
		).toStrictEqual({kind: 'track', id: '11dFghVXANMlKmJXsNCbNl'})
	})

	it('takes the first reference in the document', () => {
		expect(
			findSpotifyRef(
				'<p>https://open.spotify.com/album/4aawyAB9vmqN3uQ7FjRGTy</p>' +
					'<p><iframe src="https://open.spotify.com/embed/playlist/7l7eNnU0hgD1beeMK7znYv"></iframe></p>',
			),
		).toStrictEqual({kind: 'album', id: '4aawyAB9vmqN3uQ7FjRGTy'})
	})

	it("finds the player in a post's web page (36532)", () => {
		expect(findSpotifyRef(PAGE)).toStrictEqual({kind: 'playlist', id: '5dJFJNxZlxoRbwIgqCTxWk'})
	})

	// Hand-written after 29002, whose player sits URL-encoded inside a page builder shortcode.
	it('finds nothing in a page with no readable reference', () => {
		expect(
			findSpotifyRef(
				'<html><body><h1>Spotify Playlist: no name</h1>' +
					'<p>[vc_raw_html]JTNDaWZyYW1lJTIwc3JjJTNEJTIyaHR0cHMlM0ElMkYlMkZvcGVuLnNwb3RpZnkuY29t[/vc_raw_html]</p>' +
					'</body></html>',
			),
		).toBeNull()
	})

	it('reads no script or style', () => {
		expect(
			findSpotifyRef('<script>"https://open.spotify.com/playlist/7l7eNnU0hgD1beeMK7znYv"</script>'),
		).toBeNull()
	})
})

describe('spotifyUrl and spotifyEmbedUrl', () => {
	it('builds the link and the player address', () => {
		let ref = {kind: 'playlist', id: '5dJFJNxZlxoRbwIgqCTxWk'} as const
		expect(spotifyUrl(ref)).toBe('https://open.spotify.com/playlist/5dJFJNxZlxoRbwIgqCTxWk')
		expect(spotifyEmbedUrl(ref)).toBe(
			'https://open.spotify.com/embed/playlist/5dJFJNxZlxoRbwIgqCTxWk',
		)
	})
})

// Only what belongs to the player loads in it.
describe('loadsInPlayer', () => {
	it("loads the player's own pages, whatever their query", () => {
		expect(
			loadsInPlayer({
				url: 'https://open.spotify.com/embed/playlist/5dJFJNxZlxoRbwIgqCTxWk',
				isTopFrame: true,
			}),
		).toBe(true)
		expect(
			loadsInPlayer({
				url: 'https://open.spotify.com/embed/playlist/5dJFJNxZlxoRbwIgqCTxWk?utm_source=generator&theme=0',
				isTopFrame: true,
			}),
		).toBe(true)
		expect(
			loadsInPlayer({
				url: 'https://open.spotify.com/embed/playlist/5dJFJNxZlxoRbwIgqCTxWk?utm_source=generator&theme=0',
				isTopFrame: true,
			}),
		).toBe(true)
		expect(loadsInPlayer({url: 'about:blank', isTopFrame: true})).toBe(true)
	})

	it('loads anything inside a frame of the player', () => {
		expect(
			loadsInPlayer({url: 'https://www.google.com/recaptcha/api2/anchor', isTopFrame: false}),
		).toBe(true)
	})

	it('sends any other page away', () => {
		expect(
			loadsInPlayer({
				url: 'https://open.spotify.com/track/11dFghVXANMlKmJXsNCbNl',
				isTopFrame: true,
			}),
		).toBe(false)
		expect(loadsInPlayer({url: 'spotify:track:11dFghVXANMlKmJXsNCbNl', isTopFrame: true})).toBe(
			false,
		)
	})
})
