import {describe, expect, it} from '@jest/globals'
import media from '../../__tests__/fixtures/gallery-media-36238.json'
import {galleryPageHeight, parseGalleryPhotos, photoFit} from '../gallery'

const IDS = [36255, 36256, 36257, 36258, 36259]
const UPLOADS = 'https://olafmessenger.com/wp-content/uploads/2026/02'

/** A media record as WordPress returns it, with only its full size. */
const bare = (id: number, sourceUrl: string, caption = '') => ({
	id,
	source_url: sourceUrl,
	caption: {rendered: caption},
	media_details: {width: 1200, height: 800, sizes: {}},
})

describe('parseGalleryPhotos', () => {
	// WordPress answers `include=` newest id first, not in the order it was asked.
	it("puts the photos in the slideshow's order, each at its large copy with the full file for zooming", () => {
		let photos = parseGalleryPhotos(media, IDS)

		expect(photos.map((photo) => photo.url)).toStrictEqual([
			`${UPLOADS}/OliviaAmschler_1-895x1200.png`,
			`${UPLOADS}/OliviaAmschler_2-896x1200.png`,
			`${UPLOADS}/OliviaAmschler_3-903x1200.png`,
			`${UPLOADS}/OliviaAmschler_4-903x1200.png`,
			`${UPLOADS}/OliviaAmschler_5-905x1200.png`,
		])
		expect(photos[0]).toStrictEqual({
			url: `${UPLOADS}/OliviaAmschler_1-895x1200.png`,
			largeUrl: `${UPLOADS}/OliviaAmschler_1.png`,
			width: 895,
			height: 1200,
			caption: '',
		})
	})

	it('leaves out a photo WordPress did not return, or returned in a shape it cannot read', () => {
		let body = [bare(2, 'https://olafmessenger.com/b.jpg'), {id: 3, source_url: 7}]
		expect(parseGalleryPhotos(body, [1, 2, 3]).map((photo) => photo.url)).toStrictEqual([
			'https://olafmessenger.com/b.jpg',
		])
	})

	it('shows a photo with no large copy at its full size, with nothing larger to zoom to', () => {
		expect(parseGalleryPhotos([bare(1, 'https://olafmessenger.com/a.jpg')], [1])).toStrictEqual([
			{url: 'https://olafmessenger.com/a.jpg', width: 1200, height: 800, caption: ''},
		])
	})

	it("reads a photo's caption as plain text", () => {
		let body = [
			bare(1, 'https://olafmessenger.com/a.jpg', '<p>Holland Hall at <em>dusk</em>.</p>\n'),
		]
		expect(parseGalleryPhotos(body, [1])[0]?.caption).toBe('Holland Hall at dusk.')
	})

	it('loads a photo WordPress lists over plain HTTP from its HTTPS address', () => {
		expect(parseGalleryPhotos([bare(1, 'http://olafmessenger.com/a.jpg')], [1])[0]?.url).toBe(
			'https://olafmessenger.com/a.jpg',
		)
	})

	it('reads a body that is not a list as no photos', () => {
		expect(parseGalleryPhotos({code: 'rest_no_route'}, IDS)).toStrictEqual([])
	})
})

describe('galleryPageHeight', () => {
	it("fits its tallest photo at the column's width, so no page grows the gallery as it turns", () => {
		let photos = [
			{width: 1200, height: 800},
			{width: 900, height: 1200},
		]
		expect(galleryPageHeight(photos, 300)).toBe(400)
	})

	it("stops at one and a half times the column's width, so a tall photo leaves the page room", () => {
		expect(galleryPageHeight([{width: 500, height: 2000}], 300)).toBe(450)
	})
})

describe('photoFit', () => {
	it("draws a photo at the column's width when it fits the page", () => {
		expect(photoFit({width: 1200, height: 800}, 300, 400)).toStrictEqual({width: 300, height: 200})
	})

	it("narrows a photo taller than the page to the page's height", () => {
		expect(photoFit({width: 500, height: 2000}, 300, 450)).toStrictEqual({width: 113, height: 450})
	})
})
