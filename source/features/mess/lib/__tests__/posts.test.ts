import {describe, expect, it} from '@jest/globals'
import posts from '../../__tests__/fixtures/posts.json'
import categoriesJson from '../../__tests__/fixtures/categories.json'
import {parseMessCategories, parseMessPosts} from '../posts'

const categories = parseMessCategories(categoriesJson)
const stories = parseMessPosts(posts, categories)
const byId = (id: number) => stories.find((s) => s.id === id)

describe('parseMessCategories', () => {
	it('keeps id, name and parent, decoding entities', () => {
		let ae = categories.find((c) => c.name === 'Arts & Entertainment')
		expect(ae?.parent).toBe(0)
	})
})

describe('parseMessPosts', () => {
	it('parses every fixture post, in order', () => {
		expect(stories.map((s) => s.id)).toStrictEqual([36859, 36911, 36885, 36904, 36843])
	})

	it('takes the section from the top-level category, not the Featured flag', () => {
		expect(byId(36859)).toMatchObject({section: 'News', column: null, featured: true})
	})

	it('takes a column from a child category', () => {
		expect(byId(36885)).toMatchObject({
			section: 'Arts & Entertainment',
			column: 'StoReview',
			featured: false,
		})
		expect(byId(36843)).toMatchObject({section: 'Variety', column: 'Playlist'})
	})

	it('flags a story featured only from a category named Featured*, not from its children', () => {
		let onlineExclusive = {...posts[0], categories: [55]}
		expect(parseMessPosts([onlineExclusive], categories)[0]).toMatchObject({
			featured: false,
			section: null,
			column: null,
		})
	})

	it('prefers a main section over another top-level category, whatever the order', () => {
		let both = {...posts[0], categories: [1139, 69]}
		expect(parseMessPosts([both], categories)[0]).toMatchObject({
			section: 'Variety',
			column: 'Poetry',
		})
	})

	it('falls back to another top-level category when no main section is present', () => {
		let specialEdition = {...posts[0], categories: [1139]}
		expect(parseMessPosts([specialEdition], categories)[0]).toMatchObject({
			section: 'Special Edition',
			column: 'Spring 2026',
		})
	})

	it('never makes Uncategorized a section', () => {
		let uncategorized = {...posts[0], categories: [1]}
		expect(parseMessPosts([uncategorized], categories)[0]).toMatchObject({
			section: null,
			column: null,
		})
	})

	it('reads every byline', () => {
		expect(byId(36911)?.bylines.map((b) => b.name)).toStrictEqual([
			'Ashlyn Wuench',
			'Kenzie Nguyen',
		])
		expect(byId(36859)?.bylines).toStrictEqual([{id: 390, name: 'Maya Betti'}])
	})

	it('reads a photo and strips its caption to text', () => {
		expect(byId(36859)?.photo).toMatchObject({
			caption: 'Students enter the President’s office on April 21 to deliver the petition.',
		})
		expect(byId(36859)?.photo?.width).toBeGreaterThan(0)
	})

	it('treats the Mess logo as no photo', () => {
		expect(byId(36904)?.photo).toBeNull()
	})

	it('treats the white Mess logo as no photo', () => {
		let withWhiteLogo = {...posts[0], featured_media: 28499}
		expect(parseMessPosts([withWhiteLogo], categories)[0]?.photo).toBeNull()
	})

	it.each([
		['width', {width: 0, height: 1334}],
		['height', {width: 2001, height: 0}],
	])('gives a photo with no %s no photo, since it has no aspect ratio', (_side, size) => {
		let unsized = structuredClone(posts[0])
		unsized._embedded['wp:featuredmedia'][0].media_details = size
		expect(parseMessPosts([unsized], categories)[0]?.photo).toBeNull()
	})

	it('gives a post without featured media no photo', () => {
		expect(byId(36843)?.photo).toBeNull()
	})

	it('decodes the title and parses the body', () => {
		expect(byId(36843)?.blocks.some((b) => b.type === 'embed')).toBe(true)
		expect(byId(36911)?.title).not.toContain('&#')
	})

	it('reads the publish time as UTC', () => {
		expect(byId(36859)?.published).toBe('2026-04-29T22:24:19.000Z')
	})

	it('skips a malformed post and keeps the rest', () => {
		let parsed = parseMessPosts([{id: 'nope'}, ...posts], categories)
		expect(parsed).toHaveLength(5)
	})

	it('skips a post with an unreadable date and keeps the rest', () => {
		let badDate = {...posts[0], date_gmt: 'nope'}
		let parsed = parseMessPosts([badDate, posts[1]], categories)
		expect(parsed.map((s) => s.id)).toStrictEqual([36911])
	})

	it('throws when every post is malformed', () => {
		expect(() => parseMessPosts([{id: 'nope'}], categories)).toThrow(
			'every Mess post was malformed',
		)
	})

	it('returns nothing for an empty feed', () => {
		expect(parseMessPosts([], categories)).toStrictEqual([])
	})
})
