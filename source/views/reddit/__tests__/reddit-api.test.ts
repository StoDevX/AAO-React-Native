/* eslint-disable camelcase */
import {parseRedditPostsJson} from '../reddit-api'

// Minimal raw post shape — only the fields parseRedditPostsJson cares about
function makeRawListing(postData: Record<string, unknown>) {
	return {data: {children: [{kind: 't3', data: postData}]}}
}

const BASE_POST = {
	id: 'abc123',
	title: 'Test post',
	author: 'test_user',
	created_utc: 1_700_000_000,
	permalink: '/r/TestSub/comments/abc123/test_post/',
	selftext_html: null,
	thumbnail: null,
	is_self: false,
}

describe('parseRedditPostsJson – link post detection', () => {
	it('detects a link post when post_hint is "link"', () => {
		const listing = makeRawListing({
			...BASE_POST,
			post_hint: 'link',
			url_overridden_by_dest: 'https://thecarletonian.com/article',
			domain: 'thecarletonian.com',
		})
		const [post] = parseRedditPostsJson(listing)
		expect(post.postType).toBe('link')
		expect(post.linkUrl).toBe('https://thecarletonian.com/article')
		expect(post.linkDomain).toBe('thecarletonian.com')
	})

	it('detects a link post when post_hint is absent but is_self is false and url_overridden_by_dest is set', () => {
		// Replicates posts like https://www.reddit.com/r/CarletonCollege/comments/1tfxzl6/
		// where post_hint may be absent but the post links to an external article
		const listing = makeRawListing({
			...BASE_POST,
			// no post_hint field
			url_overridden_by_dest:
				'https://thecarletonian.com/20934/viewpoint/where-have-all-the-communal-meals-gone/',
			domain: 'thecarletonian.com',
		})
		const [post] = parseRedditPostsJson(listing)
		expect(post.postType).toBe('link')
		expect(post.linkUrl).toBe(
			'https://thecarletonian.com/20934/viewpoint/where-have-all-the-communal-meals-gone/',
		)
		expect(post.linkDomain).toBe('thecarletonian.com')
	})

	it('does not treat a self post as a link post even when url_overridden_by_dest is set', () => {
		const listing = makeRawListing({
			...BASE_POST,
			is_self: true,
			selftext_html: '<p>Text content</p>',
			url_overridden_by_dest:
				'https://www.reddit.com/r/TestSub/comments/abc123/test_post/',
			domain: 'self.TestSub',
		})
		const [post] = parseRedditPostsJson(listing)
		expect(post.postType).toBe('text')
		expect(post.linkUrl).toBeNull()
	})

	it('does not classify a post as link when url_overridden_by_dest is absent', () => {
		const listing = makeRawListing({
			...BASE_POST,
			is_self: true,
			selftext_html: '<p>Just text</p>',
		})
		const [post] = parseRedditPostsJson(listing)
		expect(post.postType).toBe('text')
		expect(post.linkUrl).toBeNull()
	})

	it('still detects image post type correctly when is_self is false', () => {
		const listing = makeRawListing({
			...BASE_POST,
			post_hint: 'image',
			url_overridden_by_dest: 'https://i.redd.it/example.jpg',
			domain: 'i.redd.it',
		})
		const [post] = parseRedditPostsJson(listing)
		expect(post.postType).toBe('image')
		expect(post.linkUrl).toBeNull()
	})
})
