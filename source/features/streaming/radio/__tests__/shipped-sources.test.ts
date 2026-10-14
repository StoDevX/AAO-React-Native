import {describe, expect, jest, test} from '@jest/globals'

import {stationSources} from '../sources'

// A fallback player page with a type this build does not load.
jest.mock('../../../../../modules/data-sources/bundled.json', () => {
	let bundled = jest.requireActual<typeof import('./fixtures/bundled-sources.json')>(
		'./fixtures/bundled-sources.json',
	)
	return {
		...bundled,
		links: bundled.links.map((link) =>
			link.rel === 'https://frogpond.tech/rel/radio-player-page'
				? {...link, type: 'text/html; charset=utf-8'}
				: link,
		),
	}
})

describe('a shipped player page this build cannot load', () => {
	// KSTO counts its listeners through that page, so losing it quietly would
	// cost them their count with nothing to say so.
	test('throws, rather than playing the station without its page', () => {
		expect(() => stationSources({subject: '', links: []}, 'ksto')).toThrow(
			/radio-player-page.*ksto/u,
		)
	})
})
