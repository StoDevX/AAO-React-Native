import {describe, expect, test} from '@jest/globals'
import {wpRoot} from '../wp-root'

describe('wpRoot', () => {
	test("is the paper's REST root for its own feed", () => {
		expect(wpRoot('https://olafmessenger.com/wp-json/wp/v2/posts?per_page=50&_embed=true')).toBe(
			'https://olafmessenger.com/wp-json/wp/v2',
		)
	})

	test("is ccc-server's copy of it for a proxied feed", () => {
		expect(wpRoot('news/mess/wp/v2/posts?per_page=50&_embed=true')).toBe('news/mess/wp/v2')
	})

	test('takes a trailing slash and no query', () => {
		expect(wpRoot('news/mess/wp/v2/posts/')).toBe('news/mess/wp/v2')
		expect(wpRoot('https://olafmessenger.com/wp-json/wp/v2/posts')).toBe(
			'https://olafmessenger.com/wp-json/wp/v2',
		)
	})

	test('refuses an href that is not a list of WordPress posts', () => {
		expect(() => wpRoot('news/named/mess')).toThrow(/not a WordPress posts href/u)
	})
})
