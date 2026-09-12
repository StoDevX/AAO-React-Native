import * as React from 'react'
import {fireEvent, render, screen} from '@testing-library/react-native'
import {CalendarPicker} from '../calendar-picker'
import type {CalendarSource} from '../sources'

// What is left is wiring: that the menu is built from the sources and options
// it is given, and hands a choice back. Which label a row reads and what a
// choice leaves the filter as are decided in
// `source/features/calendar/picker-state.ts` and asserted there, without a
// stand-in for `@expo/ui`.
jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../source/testing/expo-ui-mock') as typeof import('../../../source/testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../source/testing/expo-ui-mock') as typeof import('../../../source/testing/expo-ui-mock')
})

jest.mock('expo-router', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./expo-router-mock') as typeof import('./expo-router-mock')
})

const SOURCES: CalendarSource[] = [
	{id: 'stolaf', title: 'St. Olaf', color: '#007aff', kind: 'remote'},
	{id: 'presence', title: 'Presence', color: '#5856d6', kind: 'remote'},
]

function picker(overrides = {}): React.ReactElement {
	return (
		<CalendarPicker
			categories={[
				{value: 'Athletics', count: 3},
				{value: 'Chapel', count: 1},
			]}
			enabledIds={['stolaf', 'presence']}
			filter={null}
			onSelectFilter={jest.fn()}
			onToggleSource={jest.fn()}
			organizations={[{value: 'Wellness Center', count: 2}]}
			sources={SOURCES}
			{...overrides}
		/>
	)
}

test('lists every calendar as a toggle', async () => {
	await render(picker())
	expect(screen.getByText('St. Olaf')).toBeTruthy()
	expect(screen.getByText('Presence')).toBeTruthy()
})

test('labels each choice with how many events match it', async () => {
	await render(picker())
	expect(screen.getByText('Athletics (3)')).toBeTruthy()
	expect(screen.getByText('Wellness Center (2)')).toBeTruthy()
})

test('omits the organisation submenu when no source names one', async () => {
	await render(picker({organizations: []}))
	expect(screen.queryByText('Organization')).toBeNull()
})

test('choosing an unselected organisation filters on it', async () => {
	let onSelectFilter = jest.fn()
	await render(picker({onSelectFilter}))

	fireEvent.press(screen.getByText('Wellness Center (2)'))

	expect(onSelectFilter).toHaveBeenCalledWith({axis: 'organization', value: 'Wellness Center'})
})

test('Reset Filters is absent while nothing is filtered', async () => {
	await render(picker())
	expect(screen.queryByText('Reset Filters')).toBeNull()
})

test('Reset Filters clears whichever axis is filtered', async () => {
	let onSelectFilter = jest.fn()
	await render(picker({filter: {axis: 'organization', value: 'Wellness Center'}, onSelectFilter}))

	fireEvent.press(screen.getByText('Reset Filters'))

	expect(onSelectFilter).toHaveBeenCalledWith(null)
})
