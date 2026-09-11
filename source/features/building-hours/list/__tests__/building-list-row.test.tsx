import React from 'react'
import moment from 'moment-timezone'
import {describe, expect, test} from '@jest/globals'
import {render} from '@testing-library/react-native'

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

describe('what the row says on its status line', () => {
	test('gives the live status when the building has hours', async () => {
		let {queryByText} = await renderRow(scheduled)

		expect(queryByText('Open until 5 PM')).not.toBeNull()
	})

	test('falls back to the note when the building has no hours at all', async () => {
		// A building with an empty `hours` is unscheduled, not closed -- saying
		// "Closed today" would claim something the data does not support.
		let {queryByText} = await renderRow(noticeOnly)

		expect(queryByText('Closed for renovation.')).not.toBeNull()
		expect(queryByText('Closed today')).toBeNull()
	})

	test('says nothing rather than guessing when there are neither hours nor a note', async () => {
		let bare: BuildingType = {name: 'Nowhere', category: 'Other', schedule: []}
		let {queryByText} = await renderRow(bare)

		expect(queryByText('Closed today')).toBeNull()
	})
})

describe('the accessibility label', () => {
	test('reads the name and the status together', async () => {
		let {queryByLabelText} = await renderRow(scheduled)

		expect(queryByLabelText('Tomson Hall, Open until 5 PM')).not.toBeNull()
	})
})
