import {afterEach, describe, expect, test} from '@jest/globals'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import * as Sentry from '@sentry/react-native'

import {DEFAULT_SELECTOR_CONFIG} from '../default-selectors'
import {parseHelpdeskPage} from '../parse-page'

jest.mock('@sentry/react-native', () => ({captureMessage: jest.fn()}))

const fixture = (name: string): string =>
	readFileSync(join(__dirname, '..', '__fixtures__', name), 'utf-8')

describe('parseHelpdeskPage', () => {
	afterEach(() => {
		jest.clearAllMocks()
	})

	test('parses mixed search results, typing each from its href', () => {
		let items = parseHelpdeskPage(fixture('search.html'), 'search', DEFAULT_SELECTOR_CONFIG)

		expect(items).toEqual([
			{
				type: 'service',
				id: '56616',
				title: 'Boodlebox Request',
				href: 'https://stolafcarleton.teamdynamix.com/TDClient/1893/StOlaf/Requests/Service/56616/Boodlebox-Request',
				snippet: expect.stringContaining('Boodlebox is an AI aggregator'),
			},
			{
				type: 'article',
				id: '168448',
				title: 'Creating a Boodlebox Account',
				href: 'https://stolafcarleton.teamdynamix.com/TDClient/1893/StOlaf/KB/Article/168448/Creating-a-Boodlebox-Account',
				snippet: expect.stringContaining('Instructions on how to create an account'),
			},
		])
	})

	test('parses categories, all typed as category', () => {
		let items = parseHelpdeskPage(
			fixture('category-list.html'),
			'serviceCatalog',
			DEFAULT_SELECTOR_CONFIG,
		)

		expect(items.map((i) => i.type)).toEqual(['category', 'category'])
		expect(items[0]).toMatchObject({
			id: '14765',
			title: 'Report an Issue',
			snippet: 'Need help with a technical issue? Start here.',
		})
	})

	test('parses a flat item list, typing every item from the page config', () => {
		let items = parseHelpdeskPage(
			fixture('item-list.html'),
			'serviceCatalogCategory',
			DEFAULT_SELECTOR_CONFIG,
		)

		expect(items).toEqual([
			{
				type: 'service',
				id: '40448',
				title: 'Account Issue',
				href: 'https://stolafcarleton.teamdynamix.com/TDClient/1893/StOlaf/Requests/Service/40448/Account-Issue?SIDs=5107',
				snippet: undefined,
			},
			{
				type: 'service',
				id: '40459',
				title: 'Network Request',
				href: 'https://stolafcarleton.teamdynamix.com/TDClient/1893/StOlaf/Requests/Service/40459/Network-Request',
				snippet: 'Network & Infrastructure',
			},
		])
	})

	test('returns an empty array and reports to Sentry when the scope selector matches nothing', () => {
		let items = parseHelpdeskPage(
			'<html><body>unrelated</body></html>',
			'search',
			DEFAULT_SELECTOR_CONFIG,
		)

		expect(items).toEqual([])
		expect(Sentry.captureMessage).toHaveBeenCalledTimes(1)
		expect(Sentry.captureMessage).toHaveBeenCalledWith(
			expect.stringContaining('search'),
			expect.objectContaining({level: 'warning'}),
		)
	})

	test('falls back to the absolute href as the id when it has no recognizable Service/Article/Category id', () => {
		let html = `
			<div>
				<div class="gutter-bottom-lg">
					<h3 class="gutter-bottom-xs">
						<a href="/TDClient/1893/StOlaf/Some/Other/Path">Weird Link</a>
					</h3>
				</div>
			</div>
		`

		let items = parseHelpdeskPage(html, 'servicesAtoZ', DEFAULT_SELECTOR_CONFIG)

		expect(items).toEqual([
			{
				type: 'service',
				id: 'https://stolafcarleton.teamdynamix.com/TDClient/1893/StOlaf/Some/Other/Path',
				title: 'Weird Link',
				href: 'https://stolafcarleton.teamdynamix.com/TDClient/1893/StOlaf/Some/Other/Path',
				snippet: undefined,
			},
		])
		expect(items[0].id).toBe(items[0].href)
	})

	test('silently skips an item missing its href', () => {
		let html = `
			<div>
				<div class="gutter-bottom-lg">
					<h3 class="gutter-bottom-xs">Untitled entry with no link</h3>
				</div>
				<div class="gutter-bottom-lg">
					<h3 class="gutter-bottom-xs">
						<a href="/TDClient/1893/StOlaf/Requests/Service/99999/Valid-Item">Valid Item</a>
					</h3>
				</div>
			</div>
		`

		let items = parseHelpdeskPage(html, 'servicesAtoZ', DEFAULT_SELECTOR_CONFIG)

		expect(items).toEqual([
			{
				type: 'service',
				id: '99999',
				title: 'Valid Item',
				href: 'https://stolafcarleton.teamdynamix.com/TDClient/1893/StOlaf/Requests/Service/99999/Valid-Item',
				snippet: undefined,
			},
		])
	})
})
