import {describe, expect, it} from '@jest/globals'
import fixtures from '../../__tests__/fixtures/crossword-playlist-posts.json'
import {parseBlocks} from '../blocks'
import {parsePlaylist} from '../playlist'

/** A fixture post's raw HTML and its blocks, as `chooseLayout` receives them. */
function post(id: number): [string, ReturnType<typeof parseBlocks>] {
	let html = fixtures.find((p) => p.id === id)?.content.rendered ?? ''
	return [html, parseBlocks(html)]
}

describe('parsePlaylist', () => {
	it('takes the embed player out of a body that is only the player (36843)', () => {
		expect(parsePlaylist(...post(36843))).toStrictEqual({
			spotify: {kind: 'playlist', id: '7l7eNnU0hgD1beeMK7znYv'},
			blocks: [],
		})
	})

	it('takes out a paragraph that is only the link (36639)', () => {
		expect(parsePlaylist(...post(36639))).toStrictEqual({
			spotify: {kind: 'playlist', id: '072f2dzlfGFgJkx9SNXaQz'},
			blocks: [],
		})
	})

	it('gives an empty body no reference (36532)', () => {
		expect(parsePlaylist(...post(36532))).toStrictEqual({spotify: null, blocks: []})
	})

	// Review Focus 2: the player goes, the writer's note stays.
	it("keeps a writer's note beside the player (30713)", () => {
		expect(parsePlaylist(...post(30713))).toStrictEqual({
			spotify: {kind: 'playlist', id: '6bscojNnnO6nZcAnnXI1Cs'},
			blocks: [
				{
					type: 'paragraph',
					runs: [
						{text: 'While you listen, check out '},
						{text: 'my picks for the biggest wins and losses', href: 'https://wp.me/p8UM5p-7Z2'},
						{text: ' of this year’s show.'},
					],
				},
			],
		})
	})

	it("keeps a writer's note beside a link in an embed figure (29321)", () => {
		let {spotify, blocks} = parsePlaylist(...post(29321))
		expect(spotify).toStrictEqual({kind: 'playlist', id: '27hCbBHE86sDY7E4H6Xfjq'})
		expect(blocks).toHaveLength(1)
		expect(blocks[0]).toMatchObject({
			type: 'paragraph',
			runs: [{text: expect.stringMatching(/^For all of the sad Oles/u)}],
		})
	})

	// Review Focus 2, hand-written: only the player the page shows is taken out.
	it('keeps a second, different player', () => {
		let html =
			'<p><iframe src="https://open.spotify.com/embed/playlist/7l7eNnU0hgD1beeMK7znYv"></iframe></p>' +
			'<p><iframe src="https://open.spotify.com/embed/album/4aawyAB9vmqN3uQ7FjRGTy"></iframe></p>'
		expect(parsePlaylist(html, parseBlocks(html)).blocks).toStrictEqual([
			{type: 'embed', url: 'https://open.spotify.com/embed/album/4aawyAB9vmqN3uQ7FjRGTy'},
		])
	})

	it('keeps a sentence that mentions the link', () => {
		let html = '<p>Listen along at https://open.spotify.com/track/11dFghVXANMlKmJXsNCbNl today.</p>'
		let {spotify, blocks} = parsePlaylist(html, parseBlocks(html))
		expect(spotify).toStrictEqual({kind: 'track', id: '11dFghVXANMlKmJXsNCbNl'})
		expect(blocks).toHaveLength(1)
	})
})
