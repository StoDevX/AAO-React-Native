import fixture from './fixtures/wp-v2-posts.json'
import {parseWpV2Posts} from '../parsers/wp-v2-posts'

test('parses the live fixture into stories', () => {
	const stories = parseWpV2Posts(fixture)
	expect(stories.length).toBeGreaterThan(0)
})

test('strips html from titles and excerpts', () => {
	const [story] = parseWpV2Posts(fixture)
	expect(story.title).not.toContain('<')
	expect(story.excerpt).not.toContain('<')
})

test('produces an iso date', () => {
	const [story] = parseWpV2Posts(fixture)
	expect(story.datePublished).toMatch(/^\d{4}-\d{2}-\d{2}T/u)
})

test('treats a naive date_gmt as utc', () => {
	const stories = parseWpV2Posts([
		{
			author: 1,
			content: {rendered: '<p>body</p>'},
			date_gmt: '2026-08-14T20:26:51',
			excerpt: {rendered: '<p>hi</p>'},
			featured_media: 0,
			link: 'https://wp.stolaf.edu/a',
			title: {rendered: 'Title'},
		},
	])
	expect(stories[0].datePublished).toBe('2026-08-14T20:26:51.000Z')
})

test('falls back to Unknown Author when the embed is absent', () => {
	const stories = parseWpV2Posts([
		{
			author: 1,
			content: {rendered: ''},
			date_gmt: '2026-08-14T20:26:51Z',
			excerpt: {rendered: ''},
			featured_media: 0,
			link: 'https://wp.stolaf.edu/a',
			title: {rendered: 'Title'},
		},
	])
	expect(stories[0].authors).toStrictEqual(['Unknown Author'])
})

test('parses a post whose featured-media embed is a WordPress error object, with no image', () => {
	const stories = parseWpV2Posts([
		{
			author: 1,
			content: {rendered: 'body'},
			date_gmt: '2026-08-14T20:26:51Z',
			excerpt: {rendered: 'hi'},
			featured_media: 42,
			link: 'https://wp.stolaf.edu/a',
			title: {rendered: 'Title'},
			_embedded: {
				'wp:featuredmedia': [
					{code: 'rest_post_invalid_id', message: 'Invalid attachment ID.', data: {status: 404}},
				],
			},
		},
	])
	expect(stories).toHaveLength(1)
	expect(stories[0].featuredImage).toBeUndefined()
})

test('skips a post that cannot be parsed while its siblings still come through', () => {
	const stories = parseWpV2Posts([
		{
			author: 1,
			content: {rendered: 'first'},
			date_gmt: '2026-08-14T20:26:51Z',
			excerpt: {rendered: 'first excerpt'},
			featured_media: 0,
			link: 'https://wp.stolaf.edu/a',
			title: {rendered: 'First'},
		},
		{
			// missing required fields (content, excerpt, title, date_gmt, link)
			author: 1,
		},
		{
			author: 1,
			content: {rendered: 'third'},
			date_gmt: '2026-08-14T20:26:51Z',
			excerpt: {rendered: 'third excerpt'},
			featured_media: 0,
			link: 'https://wp.stolaf.edu/c',
			title: {rendered: 'Third'},
		},
	])
	expect(stories.map((s) => s.title)).toStrictEqual(['First', 'Third'])
})

test('throws when the response is not an array', () => {
	expect(() => parseWpV2Posts({not: 'an array'})).toThrow()
})

test('throws when every post in a non-empty response is malformed', () => {
	expect(() => parseWpV2Posts([{author: 1}, {author: 2}, 'garbage'])).toThrow()
})

test('returns an empty list when the feed legitimately has no posts', () => {
	expect(parseWpV2Posts([])).toStrictEqual([])
})
