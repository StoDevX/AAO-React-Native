import {describe, expect, jest, test} from '@jest/globals'
import {readdirSync, readFileSync} from 'node:fs'
import {join} from 'node:path'

import {parsePresenceEvents} from '../parsers/presence'
import {parseTecEvents} from '../parsers/tec-events'

jest.mock('@sentry/react-native', () => ({captureException: jest.fn()}))

// The campus UI tests' recordings keep only the fields the recorder's TRIMS
// names (scripts/campus-fixtures.mjs). A parser that starts to need another
// field fails here, rather than as a smoke test that times out.
const RECORDINGS = join(__dirname, '../../../source/features/campus/__fixtures__')

function recordings(matching: RegExp): Array<{name: string; json: unknown}> {
	return readdirSync(RECORDINGS).flatMap((domain) =>
		readdirSync(join(RECORDINGS, domain))
			.filter((name) => matching.test(name))
			.map((name) => {
				let file = JSON.parse(readFileSync(join(RECORDINGS, domain, name), 'utf8')) as {
					json: unknown
				}
				return {name: `${domain}/${name}`, json: file.json}
			}),
	)
}

const TEC = recordings(/tribe-events/u)
const PRESENCE = recordings(/presence\.io/u)

describe('the recorded St. Olaf calendar', () => {
	test('is recorded at all', () => {
		expect(TEC.length).toBeGreaterThan(0)
	})

	test.each(TEC)('$name parses, every event of it', ({json}) => {
		let page = json as {events: unknown[]}
		expect(parseTecEvents(page)).toHaveLength(page.events.length)
	})
})

describe('the recorded Presence calendar', () => {
	test('is recorded at all', () => {
		expect(PRESENCE.length).toBeGreaterThan(0)
	})

	test.each(PRESENCE)('$name parses, every event of it', ({json}) => {
		expect(parsePresenceEvents(json)).toHaveLength((json as unknown[]).length)
	})
})
