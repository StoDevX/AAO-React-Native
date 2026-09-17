import {slugFromHref} from '../slug-from-href'

describe('slugFromHref', () => {
	it('reads the slug off a real category href', () => {
		expect(
			slugFromHref(
				'https://stolafcarleton.teamdynamix.com/TDClient/1893/StOlaf/Requests/ServiceCatalog/Category/14765/Report-an-Issue',
			),
		).toBe('Report-an-Issue')
	})

	// A trailing slash would otherwise leave `.split('/').pop()` with `''`,
	// producing a category URL with a missing slug segment.
	it('ignores a trailing slash', () => {
		expect(slugFromHref('https://example.com/Category/12/network-and-wifi/')).toBe(
			'network-and-wifi',
		)
	})

	it('ignores a query string', () => {
		expect(slugFromHref('https://example.com/Category/12/network-and-wifi?ref=search')).toBe(
			'network-and-wifi',
		)
	})

	it('ignores a query string on a trailing slash', () => {
		expect(slugFromHref('https://example.com/Category/12/network-and-wifi/?ref=search')).toBe(
			'network-and-wifi',
		)
	})
})
