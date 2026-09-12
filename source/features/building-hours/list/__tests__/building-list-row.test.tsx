import React from 'react'
import moment from 'moment-timezone'
import {describe, expect, test} from '@jest/globals'
import {render} from '@testing-library/react-native'
import * as ReactNative from 'react-native'

import {BuildingListRow} from '../building-list-row'
import type {BuildingType} from '../../types'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../../testing/expo-ui-mock') as typeof import('../../../../testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../../testing/expo-ui-mock') as typeof import('../../../../testing/expo-ui-mock')
})

const now = moment.tz('2026-09-07 14:00', 'America/Chicago') // Monday 2pm

const scheduled: BuildingType = {
	name: 'Tomson Hall',
	category: 'Academia',
	schedule: [
		{title: 'Hours', hours: [{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '8:00am', to: '5:00pm'}]},
	],
}

const noticeOnly: BuildingType = {
	name: 'The Cage',
	category: 'Dining',
	schedule: [{title: 'Hours', notes: 'Closed for renovation.', hours: []}],
}

const almostOpen: BuildingType = {
	name: 'Buntrock Commons',
	category: 'Student Life',
	schedule: [{title: 'Hours', hours: [{days: ['Mo'], from: '2:15pm', to: '5:00pm'}]}],
}

const almostClosed: BuildingType = {
	name: 'Rolvaag Memorial Library',
	category: 'Academia',
	schedule: [{title: 'Hours', hours: [{days: ['Mo'], from: '8:00am', to: '2:15pm'}]}],
}

function renderRow(building: BuildingType, isFavorite = false) {
	return render(
		<BuildingListRow
			building={building}
			isFavorite={isFavorite}
			now={now}
			onSelect={jest.fn()}
			onToggleFavorite={jest.fn()}
		/>,
	)
}

afterEach(() => {
	jest.restoreAllMocks()
})

describe('what the row says on its status line', () => {
	test('gives the live status when the building has hours', async () => {
		let {queryByText} = await renderRow(scheduled)

		expect(queryByText('Open until 5 PM')).not.toBeNull()
	})

	test('falls back to the note when the building has no hours at all', async () => {
		// A building with an empty `hours` is unscheduled, not closed -- saying
		// "Closed" would claim something the data does not support.
		let {queryByText} = await renderRow(noticeOnly)

		expect(queryByText('Closed for renovation.')).not.toBeNull()
		expect(queryByText('Closed')).toBeNull()
	})

	test('says nothing rather than guessing when there are neither hours nor a note', async () => {
		let bare: BuildingType = {name: 'Nowhere', category: 'Other', schedule: []}
		let {queryByText} = await renderRow(bare)

		expect(queryByText('Closed')).toBeNull()
	})
})

describe('the accessibility label', () => {
	test('reads the name and the status together', async () => {
		let {queryByLabelText} = await renderRow(scheduled)

		expect(queryByLabelText('Tomson Hall, Open until 5 PM')).not.toBeNull()
	})
})

describe('the status glyph', () => {
	test('uses the inverse half-filled symbols in dark mode', async () => {
		jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('dark')

		let almostOpenRow = await renderRow(almostOpen)
		let almostClosedRow = await renderRow(almostClosed)

		expect(almostOpenRow.queryByTestId('symbol-circle.lefthalf.filled.inverse')).not.toBeNull()
		expect(almostClosedRow.queryByTestId('symbol-circle.righthalf.filled.inverse')).not.toBeNull()
	})
})
