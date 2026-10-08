import {expect, jest, test} from '@jest/globals'
import {fetchSourceBody} from '@frogpond/data-sources'

import {scheduleCalendarOptions} from '../query'

// A St. Olaf campus test: its recording answers the feed.
jest.mock('@frogpond/launch-arguments', () => ({
	isUITesting: true,
	campusFixturesDomain: 'stolaf.edu',
	servesBundledFixtures: false,
}))
jest.mock('@sentry/react-native', () => ({captureException: jest.fn()}))
jest.mock('@frogpond/data-sources', () => ({
	...(jest.requireActual('@frogpond/data-sources') as object),
	fetchManifest: jest.fn(() => Promise.resolve({links: []})),
	fetchSourceBody: jest.fn(() => Promise.resolve({events: []})),
}))

test('a campus test asks the St. Olaf feed for the month from the frozen date, which its recording holds', async () => {
	let {queryFn} = scheduleCalendarOptions('stolaf')
	if (typeof queryFn !== 'function') throw new TypeError('no queryFn')
	await queryFn({queryKey: ['schedule', 'stolaf'], signal: undefined} as never)

	let href = jest.mocked(fetchSourceBody).mock.calls[0][0]
	let params = new URLSearchParams(href.split('?')[1])
	expect(params.get('ends_after')).toBe('2026-09-04')
	expect(params.get('starts_before')).toBe('2026-10-05')
})
