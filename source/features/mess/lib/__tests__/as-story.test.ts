import {describe, expect, it} from '@jest/globals'
import {asStory} from '../as-story'
import type {MessStory} from '../../types'

const base: MessStory = {
	id: 1,
	title: 'T',
	excerpt: 'E',
	link: 'https://olafmessenger.com/1/',
	published: '2026-04-29T22:24:19.000Z',
	section: 'News',
	column: 'Good Questions',
	featured: true,
	bylines: [{id: 390, name: 'Maya Betti'}],
	photo: {url: 'https://x.test/p.jpg', width: 600, height: 400, caption: ''},
	blocks: [],
	layout: {kind: 'article'},
}

describe('asStory', () => {
	it('files a story under its section alone, so the picker offers sections', () => {
		expect(asStory(base).categories).toStrictEqual(['News'])
	})
	it('carries the headline, excerpt, date, photo, bylines and link', () => {
		expect(asStory(base)).toMatchObject({
			title: 'T',
			excerpt: 'E',
			datePublished: '2026-04-29T22:24:19.000Z',
			featuredImage: 'https://x.test/p.jpg',
			authors: ['Maya Betti'],
			link: 'https://olafmessenger.com/1/',
		})
	})
	it('leaves out the photo when there is none, so the row shows the Mess thumbnail', () => {
		expect(asStory({...base, photo: null}).featuredImage).toBeUndefined()
	})
	it('has no category when there is no section', () => {
		expect(asStory({...base, section: null}).categories).toStrictEqual([])
	})
})
