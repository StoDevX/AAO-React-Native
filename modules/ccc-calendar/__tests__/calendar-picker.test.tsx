import * as React from 'react'
import {fireEvent, render, screen} from '@testing-library/react-native'
import {CalendarPicker} from '../calendar-picker'
import type {CalendarSource} from '../sources'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../filter/__tests__/expo-ui-mock') as typeof import('../../filter/__tests__/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../filter/__tests__/expo-ui-mock') as typeof import('../../filter/__tests__/expo-ui-mock')
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

test('choosing the category already filtered on clears the filter', async () => {
	let onSelectFilter = jest.fn()
	await render(picker({filter: {axis: 'category', value: 'Athletics'}, onSelectFilter}))

	fireEvent.press(screen.getByText('Athletics (3)'))

	expect(onSelectFilter).toHaveBeenCalledWith(null)
})

test('a category on one axis does not read as selected on the other', async () => {
	let onSelectFilter = jest.fn()
	await render(picker({filter: {axis: 'organization', value: 'Athletics'}, onSelectFilter}))

	fireEvent.press(screen.getByText('Athletics (3)'))

	expect(onSelectFilter).toHaveBeenCalledWith({axis: 'category', value: 'Athletics'})
})

test('a submenu row names the selection on its own axis', async () => {
	await render(picker({filter: {axis: 'category', value: 'Athletics'}}))

	expect(screen.getByText('Category: Athletics')).toBeTruthy()
	expect(screen.getByText('Organization')).toBeTruthy()
})

test('a submenu row names nothing when the other axis is filtered', async () => {
	await render(picker({filter: {axis: 'organization', value: 'Wellness Center'}}))

	expect(screen.getByText('Category')).toBeTruthy()
	expect(screen.getByText('Organization: Wellness Center')).toBeTruthy()
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
