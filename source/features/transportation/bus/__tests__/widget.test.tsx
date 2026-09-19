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

function renderWidget(line: UnprocessedBusLine, onPressStop = jest.fn()) {
	return render(
		<BusLineWidget
			line={line}
			now={MONDAY_AFTERNOON}
			onPressLine={jest.fn()}
			onPressStop={onPressStop}
		/>,
	)
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

	test('reports which stop was pressed', async () => {
		let onPressStop = jest.fn()
		let {getByLabelText} = await renderWidget(makeLine(), onPressStop)

		// Matched on the name alone: the departure beside it is written by
		// Intl through the device's locale, which is not a decision this
		// component makes and not one Jest should be pinning.
		await fireEvent.press(getByLabelText(/^Carleton,/u))

		expect(onPressStop).toHaveBeenCalledWith('Carleton')
	})
})
