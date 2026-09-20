import React from 'react'
import {describe, expect, jest, test} from '@jest/globals'
import {fireEvent, render} from '@testing-library/react-native'
import moment from 'moment-timezone'

import {BusLineWidget} from '../widget'
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

// A Monday, so the running line below is on its schedule and the idle one is not.
const MONDAY_AFTERNOON = moment.tz('2019-12-16T13:02:00', CENTRAL_TZ)

function makeLine(overrides: Partial<UnprocessedBusLine> = {}): UnprocessedBusLine {
	return {
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
		...overrides,
	}
}

function renderWidget(line: UnprocessedBusLine, onPress = jest.fn(), now = MONDAY_AFTERNOON) {
	return render(<BusLineWidget line={line} now={now} onPress={onPress} />)
}

describe('BusLineWidget', () => {
	test('lists every stop on the route when the line is running', async () => {
		let {getByText} = await renderWidget(makeLine())

		expect(getByText('St. Olaf')).toBeTruthy()
		expect(getByText('Carleton')).toBeTruthy()
	})

	test('shows only the header, and no strip, when the line does not run today', async () => {
		let idle = makeLine({
			schedules: [{days: ['Sa'], coordinates: {}, stops: ['St. Olaf'], times: [['1:00pm']]}],
		})

		let {getByText, queryByText} = await renderWidget(idle)

		expect(getByText(/Not running today/u)).toBeTruthy()
		expect(queryByText('St. Olaf')).toBeNull()
	})

	test('pressing a stop cell opens the line, same as the header', async () => {
		let onPress = jest.fn()
		let {getByLabelText} = await renderWidget(makeLine(), onPress)

		// Matched on the name alone: the departure beside it is written by
		// Intl through the device's locale, which is not a decision this
		// component makes and not one Jest should be pinning.
		await fireEvent.press(getByLabelText(/^Carleton,/u))

		expect(onPress).toHaveBeenCalled()
	})

	test('draws the bus on the strip while the line is running', async () => {
		let {getAllByTestId} = await renderWidget(makeLine())

		// One glyph is the header's. The other two are the bus itself, drawn by
		// the stops either side of the leg it is on: they resolve to the same
		// point and superimpose, which is what lets a bus straddling two rows
		// survive the clipping in the timetable's list.
		expect(getAllByTestId('symbol-bus.fill')).toHaveLength(3)
	})

	test('keeps the bus off the strip before the first departure', async () => {
		let beforeStart = MONDAY_AFTERNOON.clone().hour(12)

		let {getAllByTestId} = await renderWidget(makeLine(), jest.fn(), beforeStart)

		expect(getAllByTestId('symbol-bus.fill')).toHaveLength(1)
	})

	test('ends the strip with the next round when another one follows today', async () => {
		let twoRounds = makeLine({
			schedules: [
				{
					days: ['Mo'],
					coordinates: {},
					stops: ['St. Olaf', 'Carleton'],
					times: [
						['1:00pm', '1:05pm'],
						['2:00pm', '2:05pm'],
					],
				},
			],
		})

		let {getByText} = await renderWidget(twoRounds)

		expect(getByText('Next departure')).toBeTruthy()
	})

	test('ends the strip at the last stop on the final round of the day', async () => {
		let {queryByText} = await renderWidget(makeLine())

		expect(queryByText('Next departure')).toBeNull()
	})
})
