import {describe, expect, test} from '@jest/globals'
import bundled from '@frogpond/data-sources/bundled.json'
import {ID_PROPERTY, REL_NEWS} from '@frogpond/data-sources'
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

	// The manifest can move the Messenger between the paper and ccc-server without a release, so
	// CI refuses an href this build could not find the REST root of before any phone sees it.
	// `bundled.json` is `data/sources.yaml` as published, and CI checks the two match.
	test("finds the REST root of the Messenger's href in the manifest", () => {
		let link = bundled.links.find(
			(entry) => entry.rel === REL_NEWS && entry.properties[ID_PROPERTY] === 'mess',
		)
		expect(link).toBeDefined()
		expect(() => wpRoot(link?.href ?? '')).not.toThrow()
	})
})
