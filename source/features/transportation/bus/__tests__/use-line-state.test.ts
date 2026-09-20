import {expect, test} from '@jest/globals'
import {renderHook} from '@testing-library/react-native'
import moment from 'moment-timezone'

import type {UnprocessedBusLine} from '../types'
import {useLineState} from '../use-line-state'

const CENTRAL_TZ = 'America/Chicago'
const MONDAY_AFTERNOON = moment.tz('2019-12-16T13:02:00', CENTRAL_TZ)

const line: UnprocessedBusLine = {
	line: 'Express Bus',
	colors: {bar: '#ff0000', dot: '#aa0000'},
	schedules: [
		{
			days: ['Mo', 'Tu'],
			coordinates: {},
			stops: ['St. Olaf', 'Carleton'],
			times: [
				['1:00pm', '1:05pm'],
				['2:00pm', '2:05pm'],
			],
		},
	],
}

// The parsed schedule is handed straight back, so its identity is the parse's:
// the same object means the feed was not walked again.
function renderForClock(now: moment.Moment) {
	return renderHook(({clock}: {clock: moment.Moment}) => useLineState({line, now: clock}), {
		initialProps: {clock: now},
	})
}

test('reuses the parsed feed as the clock ticks through the day', async () => {
	let {result, rerender} = await renderForClock(MONDAY_AFTERNOON)
	let first = result.current.schedule

	await rerender({clock: MONDAY_AFTERNOON.clone().add(1, 'minute')})

	expect(result.current.schedule).toBe(first)
})

test('still reads the clock, so the status moves with it', async () => {
	let {result, rerender} = await renderForClock(MONDAY_AFTERNOON)
	expect(result.current.subtitle).toBe('Running')

	await rerender({clock: MONDAY_AFTERNOON.clone().hour(23)})

	expect(result.current.subtitle).toBe('Over for today')
})

test('parses the feed again for a different day, which stamps different dates', async () => {
	let {result, rerender} = await renderForClock(MONDAY_AFTERNOON)
	let first = result.current.schedule

	await rerender({clock: MONDAY_AFTERNOON.clone().add(1, 'day')})

	expect(result.current.schedule).not.toBe(first)
})
