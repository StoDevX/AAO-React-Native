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
})
