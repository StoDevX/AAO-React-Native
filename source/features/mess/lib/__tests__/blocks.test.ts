import {describe, expect, it} from '@jest/globals'
import {parseBlocks} from '../blocks'

describe('parseBlocks', () => {
	it('keeps a paragraph as one plain run', () => {
		expect(parseBlocks('<p>Hello there.</p>')).toStrictEqual([
			{type: 'paragraph', runs: [{text: 'Hello there.'}]},
		])
	})

	it('drops the Google Docs span wrapper but keeps its text', () => {
		let html = '<p><span style="font-weight: 400;">Cage grilled cheese.</span></p>'
		expect(parseBlocks(html)).toStrictEqual([
			{type: 'paragraph', runs: [{text: 'Cage grilled cheese.'}]},
		])
	})

	it('drops a paragraph that is only a non-breaking space', () => {
		expect(parseBlocks('<p>&nbsp;</p><p>Kept.</p>')).toStrictEqual([
			{type: 'paragraph', runs: [{text: 'Kept.'}]},
		])
	})

	it('collapses runs of whitespace to one space', () => {
		expect(parseBlocks('<p>Two  spaces&nbsp; and\na newline</p>')).toStrictEqual([
			{type: 'paragraph', runs: [{text: 'Two spaces and a newline'}]},
		])
	})

	it('keeps a line break inside a paragraph', () => {
		expect(parseBlocks('<p>First line<br>Second line</p>')).toStrictEqual([
			{type: 'paragraph', runs: [{text: 'First line\nSecond line'}]},
		])
	})

	it('nests bold, italic and links', () => {
		let html = '<p>A <b>bold <i>and italic</i></b> <a href="https://x.test/">link</a>.</p>'
		expect(parseBlocks(html)).toStrictEqual([
			{
				type: 'paragraph',
				runs: [
					{text: 'A '},
					{text: 'bold ', bold: true},
					{text: 'and italic', bold: true, italic: true},
					{text: ' '},
					{text: 'link', href: 'https://x.test/'},
					{text: '.'},
				],
			},
		])
	})

	it('treats strong and em as bold and italic', () => {
		expect(parseBlocks('<p><strong>S</strong><em>E</em></p>')).toStrictEqual([
			{
				type: 'paragraph',
				runs: [
					{text: 'S', bold: true},
					{text: 'E', italic: true},
				],
			},
		])
	})

	it('reads ordered and unordered lists, one item per li', () => {
		let html = '<ol><li><span>One</span></li><li>Two</li></ol><ul><li>Dot</li></ul>'
		expect(parseBlocks(html)).toStrictEqual([
			{type: 'list', ordered: true, items: [[{text: 'One'}], [{text: 'Two'}]]},
			{type: 'list', ordered: false, items: [[{text: 'Dot'}]]},
		])
	})

	it('reads a blockquote as a quote', () => {
		expect(parseBlocks('<blockquote><p>Said so.</p></blockquote>')).toStrictEqual([
			{type: 'quote', runs: [{text: 'Said so.'}]},
		])
	})

	it('reads a figure with its caption', () => {
		let html =
			'<figure><img src="https://x.test/a.jpg" width="600" height="400"><figcaption>Holland Hall.</figcaption></figure>'
		expect(parseBlocks(html)).toStrictEqual([
			{
				type: 'figure',
				url: 'https://x.test/a.jpg',
				width: 600,
				height: 400,
				caption: 'Holland Hall.',
			},
		])
	})

	it('reads a bare image as a figure with no caption', () => {
		expect(
			parseBlocks('<p><img src="https://x.test/b.jpg" width="10" height="20"></p>'),
		).toStrictEqual([
			{type: 'figure', url: 'https://x.test/b.jpg', width: 10, height: 20, caption: ''},
		])
	})

	it('drops an image without a size, which cannot be laid out before it loads', () => {
		expect(parseBlocks('<figure><img src="https://x.test/c.jpg"></figure>')).toStrictEqual([])
	})

	it('reads an iframe as an embed, even inside a figure', () => {
		let html = '<figure><iframe src="https://open.spotify.com/embed/p"></iframe></figure>'
		expect(parseBlocks(html)).toStrictEqual([
			{type: 'embed', url: 'https://open.spotify.com/embed/p'},
		])
	})

	it('reads an iframe inside a paragraph as an embed, as WordPress wraps a Spotify player', () => {
		let html = '<p><iframe src="https://open.spotify.com/embed/p"></iframe></p>'
		expect(parseBlocks(html)).toStrictEqual([
			{type: 'embed', url: 'https://open.spotify.com/embed/p'},
		])
	})

	it('keeps an unknown element as a paragraph of its text', () => {
		expect(parseBlocks('<h3>A <b>heading</b></h3>')).toStrictEqual([
			{type: 'paragraph', runs: [{text: 'A '}, {text: 'heading', bold: true}]},
		])
	})

	it('drops scripts and styles, which are not words', () => {
		expect(parseBlocks('<script>track()</script><style>p{}</style><p>Body</p>')).toStrictEqual([
			{type: 'paragraph', runs: [{text: 'Body'}]},
		])
	})

	it('reads the Cows, Comments and Confessions list from a real post', () => {
		// oxlint-disable-next-line typescript/no-require-imports
		let posts = require('../../__tests__/fixtures/posts.json') as Array<{
			id: number
			content: {rendered: string}
		}>
		let cows = posts.find((p) => p.id === 36911)
		let blocks = parseBlocks(cows?.content.rendered ?? '')
		let list = blocks.find((b) => b.type === 'list')
		expect(list).toMatchObject({type: 'list', ordered: true})
		expect(
			blocks.some((b) => b.type === 'paragraph' && b.runs.some((r) => r.text.includes('<'))),
		).toBe(false)
	})
})
