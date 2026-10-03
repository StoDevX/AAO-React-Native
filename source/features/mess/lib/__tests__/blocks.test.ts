import {describe, expect, it} from '@jest/globals'
import {parseBlocks} from '../blocks'

/** SNO's slideshow embed, from "Between places" (36238). */
const SNO_SLIDESHOW =
	'<div class="photowrap">\n\t<div class=\'sfiphotowrap sfiphotowrap modal-photo\' data-photo-ids=\'36255,36256,36257,36258,36259\' data-story-id=\'36238\'>\n\t\t<div id=\'storypageslideshow\' style=\'max-width: 400px; margin: 0 auto;\'>\n\t\t\t<div class="slideshowwrap" data-ratio="0.74583333333333">\n\t\t\t\t<img decoding="async" src="https://olafmessenger.com/wp-content/uploads/2026/02/OliviaAmschler_1-895x1200.png" class="slideshow-photo" alt="OliviaAmschler_1" data-width="895" data-height="1200" />\n                <a class=\'modal-photo\' href=\'#slideshow\' aria-haspopup=\'dialog\' aria-expanded=\'false\' aria-label=\'Gallery - 5 Photos.\'>\n                                            <div class=\'slideshow-enlarge\'>\n                            <div class="fa fa-clone slideshow-icon"></div>\n                            <div class=\'slideshow-title\'>Gallery<span class=\'v-divider\'> &bull; </span>5 Photos</div>\n                        </div>\n                                    </a>\n\t\t\t</div>\n\t\t\t\t\t\t\t<div class="captionboxmittop">\n\t\t\t\t\t<div class="photocredit"><a href="https://olafmessenger.com/staff_name/olivia-amschler/">Olivia Amschler</a></div>\t\t\t\t\t\t\t\t\t</div>\n\t\t\t\n\t\t</div>\n\t</div>\n</div>\n<div class="photobottom"></div>\n<div class="clear"></div>\n<div class="newssourcephotos" data-photoids="36255,36256,36257,36258,36259"></div>\n\n'

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

	it("keeps the srcset's largest copy beside the image it shows, for the zoom viewer", () => {
		let html =
			'<figure><img src="https://x.test/a-600x400.jpg" width="600" height="400" ' +
			'srcset="https://x.test/a-600x400.jpg 600w, https://x.test/a-1536x1024.jpg 1536w, https://x.test/a-768x512.jpg 768w">' +
			'</figure>'
		expect(parseBlocks(html)).toStrictEqual([
			{
				type: 'figure',
				url: 'https://x.test/a-600x400.jpg',
				largeUrl: 'https://x.test/a-1536x1024.jpg',
				width: 600,
				height: 400,
				caption: '',
			},
		])
	})

	it('keeps no larger copy when the srcset offers only the image it shows', () => {
		let html =
			'<img src="https://x.test/a.jpg" width="600" height="400" srcset="https://x.test/a.jpg 600w">'
		expect(parseBlocks(html)).toStrictEqual([
			{type: 'figure', url: 'https://x.test/a.jpg', width: 600, height: 400, caption: ''},
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

	it('keeps the caption of an image without a size as a paragraph', () => {
		let html = '<figure><img src="https://x.test/c.jpg"><figcaption>Old Main.</figcaption></figure>'
		expect(parseBlocks(html)).toStrictEqual([{type: 'paragraph', runs: [{text: 'Old Main.'}]}])
	})

	it('drops an image with a zero size, which has no aspect ratio', () => {
		let html =
			'<img src="https://x.test/d.jpg" width="0" height="20"><img src="https://x.test/e.jpg" width="10" height="0">'
		expect(parseBlocks(html)).toStrictEqual([])
	})

	it('reads a gallery as one figure per image, then its own caption', () => {
		let html =
			'<figure class="wp-block-gallery">' +
			'<figure><img src="https://x.test/a.jpg" width="1" height="2"><figcaption>A</figcaption></figure>' +
			'<figure><img src="https://x.test/b.jpg" width="3" height="4"><figcaption>B</figcaption></figure>' +
			'<figcaption>Both.</figcaption></figure>'
		expect(parseBlocks(html)).toStrictEqual([
			{type: 'figure', url: 'https://x.test/a.jpg', width: 1, height: 2, caption: 'A'},
			{type: 'figure', url: 'https://x.test/b.jpg', width: 3, height: 4, caption: 'B'},
			{type: 'paragraph', runs: [{text: 'Both.'}]},
		])
	})

	// "Between places" (36238), as olafmessenger.com served it on 2026-10-03: SNO's slideshow carries
	// only its first photo, and names the rest by their WordPress media ids.
	it("reads SNO's slideshow as one gallery, leaving out its overlay and credit link", () => {
		expect(parseBlocks(SNO_SLIDESHOW)).toStrictEqual([
			{
				type: 'gallery',
				photoIds: [36255, 36256, 36257, 36258, 36259],
				cover: {
					url: 'https://olafmessenger.com/wp-content/uploads/2026/02/OliviaAmschler_1-895x1200.png',
					width: 895,
					height: 1200,
				},
				credit: 'Olivia Amschler',
			},
		])
	})

	it('reads a slideshow whose first photo has no size as a gallery with no cover', () => {
		let html = SNO_SLIDESHOW.replace(' data-width="895" data-height="1200"', '')
		expect(parseBlocks(html)).toStrictEqual([
			{
				type: 'gallery',
				photoIds: [36255, 36256, 36257, 36258, 36259],
				cover: null,
				credit: 'Olivia Amschler',
			},
		])
	})

	it('keeps the words around a slideshow', () => {
		let blocks = parseBlocks(`<p>Before.</p>${SNO_SLIDESHOW}<p>After.</p>`)
		expect(blocks.map((block) => block.type)).toStrictEqual(['paragraph', 'gallery', 'paragraph'])
	})

	it('reads a slideshow that names no photos as the words it holds', () => {
		let html = SNO_SLIDESHOW.replaceAll(/data-photo-?ids='[^']*'/gu, "data-photo-ids=''")
		expect(parseBlocks(html).some((block) => block.type === 'gallery')).toBe(false)
	})

	it('reads a figure nested three deep once', () => {
		let html =
			'<figure class="wp-block-gallery">' +
			'<figure><figure><img src="https://x.test/a.jpg" width="1" height="2"><figcaption>A</figcaption></figure></figure>' +
			'</figure>'
		expect(parseBlocks(html)).toStrictEqual([
			{type: 'figure', url: 'https://x.test/a.jpg', width: 1, height: 2, caption: 'A'},
		])
	})

	it('breaks the line between paragraphs inside a quote, so their words stay apart', () => {
		expect(parseBlocks('<blockquote><p>A</p><p>B</p></blockquote>')).toStrictEqual([
			{type: 'quote', runs: [{text: 'A\nB'}]},
		])
	})

	it('breaks the line once between paragraphs separated by whitespace', () => {
		expect(parseBlocks('<blockquote>\n<p>A</p>\n<p>B</p>\n</blockquote>')).toStrictEqual([
			{type: 'quote', runs: [{text: 'A\nB'}]},
		])
	})

	it('breaks the line between paragraphs inside an unknown element', () => {
		expect(parseBlocks('<div><p><b>A</b></p><p>B</p></div>')).toStrictEqual([
			{type: 'paragraph', runs: [{text: 'A', bold: true}, {text: '\nB'}]},
		])
	})

	it('reads an iframe as an embed, even inside a figure', () => {
		let html = '<figure><iframe src="https://open.spotify.com/embed/p"></iframe></figure>'
		expect(parseBlocks(html)).toStrictEqual([
			{type: 'embed', url: 'https://open.spotify.com/embed/p'},
		])
	})

	it("keeps an embed block's caption as a paragraph after the embed", () => {
		let html =
			'<figure class="wp-block-embed is-type-rich is-provider-spotify wp-block-embed-spotify">' +
			'<div class="wp-block-embed__wrapper">\n<iframe src="https://open.spotify.com/embed/p"></iframe>\n</div>' +
			'<figcaption class="wp-element-caption">Songs for <em>finals</em> week</figcaption></figure>'
		expect(parseBlocks(html)).toStrictEqual([
			{type: 'embed', url: 'https://open.spotify.com/embed/p'},
			{
				type: 'paragraph',
				runs: [{text: 'Songs for '}, {text: 'finals', italic: true}, {text: ' week'}],
			},
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
