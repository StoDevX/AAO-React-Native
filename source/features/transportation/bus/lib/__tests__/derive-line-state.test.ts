import {expect, test} from '@jest/globals'

import {deriveLineState} from '../derive-line-state'
import {dayAndTime} from './moment.helper'

import type {UnprocessedBusLine} from '../../types'

// A single route, Mo/Tu only, that runs three rounds a day with one stop
// skipped mid-route -- enough to reach every branch `deriveLineState` picks
// between.
const line: UnprocessedBusLine = {
	line: 'Express Bus',
	colors: {bar: '#000000', dot: '#000000'},
	schedules: [
		{
			days: ['Mo', 'Tu'],
			coordinates: {},
			stops: ['St. Olaf', 'Carleton', 'Third'],
			// prettier-ignore
			times: [
				['1:00pm', '1:05pm', '1:10pm'],
				['2:00pm', false,    '2:10pm'],
				['3:00pm', '3:05pm', '3:10pm'],
			],
		},
	],
}

test('before the first round starts, counts down to it', () => {
	let now = dayAndTime('Mo 12:00pm')
	let {status, subtitle} = deriveLineState({line, now})
	expect(status).toBe('before-start')
	expect(subtitle).toMatch(/^Starts /u)
})

test('mid-round, and not the last one, says Running', () => {
	let now = dayAndTime('Mo 1:02pm')
	let {status, subtitle} = deriveLineState({line, now})
	expect(status).toBe('running')
	expect(subtitle).toBe('Running')
})

test('on the last round of the day, says Last Bus', () => {
	let now = dayAndTime('Mo 3:02pm')
	let {status, subtitle} = deriveLineState({line, now})
	expect(status).toBe('running')
	expect(subtitle).toBe('Last Bus')
})

test('between two rounds, counts down to the next one', () => {
	let now = dayAndTime('Mo 1:30pm')
	let {status, subtitle} = deriveLineState({line, now})
	expect(status).toBe('between-rounds')
	expect(subtitle).toMatch(/^Starts /u)
})

test('after the last round finishes, says Over for today', () => {
	let now = dayAndTime('Mo 11:00pm')
	let {status, subtitle} = deriveLineState({line, now})
	expect(status).toBe('after-end')
	expect(subtitle).toBe('Over for today')
})

test('on a day the line does not run at all, says Not running today', () => {
	let now = dayAndTime('We 1:00pm')
	let {status, subtitle} = deriveLineState({line, now})
	expect(status).toBe('none')
	expect(subtitle).toBe('Not running today')
})
