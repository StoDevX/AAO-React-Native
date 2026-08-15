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
