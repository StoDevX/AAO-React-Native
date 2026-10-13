import {describe, expect, it} from '@jest/globals'
import {SourceFetchError} from '@frogpond/data-sources'
import {emptyPastLastPage, nextPage, pageHref} from '../paging'

describe('pageHref', () => {
	it('leaves the first page’s address as it is', () => {
		expect(
			pageHref('https://olafmessenger.com/wp-json/wp/v2/posts?per_page=50&_embed=true', 1),
		).toBe('https://olafmessenger.com/wp-json/wp/v2/posts?per_page=50&_embed=true')
	})

	it('asks for a later page by number', () => {
		expect(
			pageHref('https://olafmessenger.com/wp-json/wp/v2/posts?per_page=50&_embed=true', 3),
		).toBe('https://olafmessenger.com/wp-json/wp/v2/posts?per_page=50&_embed=true&page=3')
	})

	it('keeps a field list as written', () => {
		expect(pageHref('https://olafmessenger.com/wp-json/wp/v2/posts?_fields=id,date', 2)).toBe(
			'https://olafmessenger.com/wp-json/wp/v2/posts?_fields=id,date&page=2',
		)
	})
})

describe('nextPage', () => {
	it('follows a full page with the one after it', () => {
		expect(nextPage([1, 2, 3], 2, 3)).toBe(3)
	})

	it('ends at a short page', () => {
		expect(nextPage([1, 2], 2, 3)).toBeUndefined()
	})

	it('ends at an empty page, whatever the page size', () => {
		expect(nextPage([], 4, 0)).toBeUndefined()
	})
})

describe('emptyPastLastPage', () => {
	const pastTheEnd = new SourceFetchError('Olaf Messenger fetch failed: 400', 400, {
		code: 'rest_post_invalid_page_number',
	})

	it('reads a 400 for a later page as an empty page', () => {
		expect(emptyPastLastPage(2)(pastTheEnd)).toStrictEqual([])
	})

	it('still fails the first page on a 400', () => {
		expect(() => emptyPastLastPage(1)(pastTheEnd)).toThrow(pastTheEnd)
	})

	it('still fails a later page on a 400 for anything else, such as a bad parameter', () => {
		let badParameter = new SourceFetchError('Olaf Messenger fetch failed: 400', 400, {
			code: 'rest_invalid_param',
		})
		expect(() => emptyPastLastPage(2)(badParameter)).toThrow(badParameter)
	})

	it('still fails a later page on a 400 that names no WordPress code, such as a proxy refusal', () => {
		let refusal = new SourceFetchError('Olaf Messenger fetch failed: 400', 400)
		expect(() => emptyPastLastPage(2)(refusal)).toThrow(refusal)
	})

	it('still fails a later page on any other error', () => {
		let error = new SourceFetchError('Olaf Messenger fetch failed: 500', 500)
		expect(() => emptyPastLastPage(2)(error)).toThrow(error)
	})
})
