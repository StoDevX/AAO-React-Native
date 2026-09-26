import React from 'react'
import moment from 'moment-timezone'
import {describe, expect, test} from '@jest/globals'
import {render, screen} from '@testing-library/react-native'
import {List} from '@expo/ui/swift-ui'

import {HoursSection} from '../hours-section'
import type {BuildingType} from '../types'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})

// A Monday, mid-morning.
const NOW = moment('2026-09-28T10:00:00')

const holland: BuildingType = {
	name: 'Holland Hall',
	category: 'Academia',
	kind: 'building',
	building: 'hh',
	schedule: [
		{
			title: 'Hours',
			hours: [
				{days: ['Mo', 'Tu', 'We', 'Th', 'Fr'], from: '7:00am', to: '10:00pm'},
				{days: ['Sa', 'Su'], from: '9:00am', to: '6:00pm'},
			],
		},
	],
}

const stav: BuildingType = {
	name: 'Stav Hall',
	category: 'Food',
	kind: 'space',
	schedule: [
		{title: 'Breakfast', hours: [{days: ['Mo'], from: '7:15am', to: '9:45am'}]},
		{
			title: 'Lunch',
			notes: 'Grill closes at 1.',
			hours: [{days: ['Mo'], from: '10:30am', to: '2:00pm'}],
		},
		{title: 'Dinner', hours: [{days: ['Mo'], from: '4:30pm', to: '8:00pm'}]},
	],
}

function renderSection(venue: BuildingType) {
	return render(
		<List>
			<HoursSection now={NOW} venue={venue} />
		</List>,
	)
}

describe('HoursSection', () => {
	test('heads a single block "Hours", with a row per day group', async () => {
		await renderSection(holland)
		expect(screen.getByText('Hours')).toBeTruthy()
		expect(screen.getByText('Weekdays')).toBeTruthy()
		expect(screen.getByText('Weekends')).toBeTruthy()
	})

	test('heads each of several blocks by its own title, under one status', async () => {
		await renderSection(stav)
		expect(screen.queryByText('Hours')).toBeNull()
		for (let title of ['Breakfast', 'Lunch', 'Dinner']) {
			expect(screen.getByText(title)).toBeTruthy()
		}
		expect(screen.getAllByText(/^(Open|Closed|Opens|Closes|Reopens)/u)).toHaveLength(1)
	})

	test('shows a note under its block', async () => {
		await renderSection(stav)
		expect(screen.getByText('Grill closes at 1.')).toBeTruthy()
	})

	// An unscheduled venue is not closed; it has only its note.
	test('shows a note, and no status, for a venue with no hours', async () => {
		await renderSection({
			...holland,
			schedule: [{title: 'Hours', notes: 'By appointment.', hours: []}],
		})
		expect(screen.getByText('By appointment.')).toBeTruthy()
		expect(screen.queryByText(/^(Open|Closed|Opens)/u)).toBeNull()
	})

	test('draws nothing for a venue with neither hours nor a note', async () => {
		await renderSection({...holland, schedule: [{title: 'Hours', hours: []}]})
		expect(screen.queryByText('Hours')).toBeNull()
	})
})
