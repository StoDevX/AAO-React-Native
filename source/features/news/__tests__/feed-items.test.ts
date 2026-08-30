import {parseFeedItems} from '../parsers/feed-items'

const validItem = {
	authors: ['A. Uthor'],
	categories: ['Category'],
	content: 'body',
	excerpt: 'excerpt',
	title: 'Title',
}

test('parses a well-formed item', () => {
	const stories = parseFeedItems([validItem])
	expect(stories).toHaveLength(1)
	expect(stories[0].title).toBe('Title')
})

test('skips a malformed item while its siblings still come through', () => {
	const stories = parseFeedItems([validItem, {authors: 'not an array'}])
	expect(stories.map((s) => s.title)).toStrictEqual(['Title'])
})

test('throws when every item in a non-empty response is malformed', () => {
	expect(() => parseFeedItems([{authors: 'not an array'}, 'garbage'])).toThrow()
})

test('returns an empty list when the feed legitimately has no items', () => {
	expect(parseFeedItems([])).toStrictEqual([])
})

test('throws when the response is not an array', () => {
	expect(() => parseFeedItems({not: 'an array'})).toThrow()
})
