import React from 'react'
import {describe, expect, jest, test} from '@jest/globals'
import {fireEvent, render} from '@testing-library/react-native'
import moment from 'moment-timezone'

import {BusLine} from '../line'
import type {UnprocessedBusLine} from '../types'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../../testing/expo-ui-mock') as typeof import('../../../../testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../../testing/expo-ui-mock') as typeof import('../../../../testing/expo-ui-mock')
})

const CENTRAL_TZ = 'America/Chicago'

// A Monday, so the line below is on its schedule.
const MONDAY_AFTERNOON = moment.tz('2019-12-16T13:02:00', CENTRAL_TZ)

const LINE: UnprocessedBusLine = {
	line: 'Express Bus',
	colors: {bar: '#ff0000', dot: '#aa0000'},
	schedules: [
		{
			days: ['Mo'],
			coordinates: {},
			stops: ['St. Olaf', 'Carleton'],
			times: [['1:00pm', '1:05pm']],
		},
	],
}

function renderLine(selectedDay: 'Mo' | 'Sa' | null = null, onPressStop = jest.fn()) {
	return render(
		<BusLine
			line={LINE}
			now={MONDAY_AFTERNOON}
			onPressStop={onPressStop}
			selectedDay={selectedDay}
		/>,
	)
}

describe('BusLine', () => {
	test('lists every stop on the route, each named for the UI tests to find', async () => {
		let {getByLabelText} = await renderLine()

		// Matched on the name alone: the departure beside it is written by
		// Intl through the device's locale, which is not a decision this
		// component makes and not one Jest should be pinning.
		expect(getByLabelText(/^St\. Olaf,/u)).toBeTruthy()
		expect(getByLabelText(/^Carleton,/u)).toBeTruthy()
	})

	test('pressing a stop opens that stop', async () => {
		let onPressStop = jest.fn()
		let {getByLabelText} = await renderLine(null, onPressStop)

		await fireEvent.press(getByLabelText(/^Carleton,/u))

		expect(onPressStop).toHaveBeenCalledWith('Carleton')
	})

	test('says the line is not running on a day it has no schedule for', async () => {
		let {getByText, queryByLabelText} = await renderLine('Sa')

		expect(getByText('This line is not running today.')).toBeTruthy()
		expect(queryByLabelText(/^St\. Olaf,/u)).toBeNull()
	})

	test('heads the stop list Stops', async () => {
		let {getByText} = await renderLine()

		expect(getByText('Stops')).toBeTruthy()
	})

	test('shows a stop at most three departures, so they fit on one line', async () => {
		let fiveRounds: UnprocessedBusLine = {
			...LINE,
			schedules: [
				{
					days: ['Mo'],
					coordinates: {},
					stops: ['St. Olaf', 'Carleton'],
					times: [
						['1:00pm', '1:05pm'],
						['2:00pm', '2:05pm'],
						['3:00pm', '3:05pm'],
						['4:00pm', '4:05pm'],
						['5:00pm', '5:05pm'],
					],
				},
			],
		}

		let {getByLabelText} = await render(
			<BusLine
				line={fiveRounds}
				now={MONDAY_AFTERNOON}
				onPressStop={jest.fn()}
				selectedDay={null}
			/>,
		)

		// Counted by separator rather than by time: the times are written by
		// Intl in the device's locale, which is not this component's decision.
		expect(getByLabelText(/^Carleton, [^•]+ • [^•]+ • [^•]+$/u)).toBeTruthy()
	})

	test('folds the stops behind the bus away, and opens them when asked', async () => {
		// Five stops, the bus between the fourth and fifth at 1:22pm, so the
		// first three sit behind it and fold away.
		let longLine: UnprocessedBusLine = {
			line: 'Express Bus',
			colors: {bar: '#ff0000', dot: '#aa0000'},
			schedules: [
				{
					days: ['Mo'],
					coordinates: {},
					stops: ['First', 'Second', 'Third', 'Fourth', 'Fifth'],
					times: [['1:00pm', '1:05pm', '1:10pm', '1:20pm', '1:30pm']],
				},
			],
		}

		let {getByText, queryByText} = await render(
			<BusLine
				line={longLine}
				now={moment.tz('2019-12-16T13:22:00', CENTRAL_TZ)}
				onPressStop={jest.fn()}
				selectedDay={null}
			/>,
		)

		expect(getByText('3 previous stops')).toBeTruthy()
		expect(queryByText('First')).toBeNull()
		// The stop behind the bus stays, so the leg it is on has both ends.
		expect(getByText('Fourth')).toBeTruthy()

		await fireEvent.press(getByText('3 previous stops'))

		expect(getByText('First')).toBeTruthy()
		expect(queryByText('3 previous stops')).toBeNull()
	})
})
