import * as React from 'react'
import {render, screen} from '@testing-library/react-native'
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
			categories={['Athletics', 'Chapel']}
			enabledIds={['stolaf', 'presence']}
			filter={null}
			onSelectFilter={jest.fn()}
			onToggleSource={jest.fn()}
			organizations={['Wellness Center']}
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

test('lists the categories and the organisations', async () => {
	await render(picker())
	expect(screen.getByText('Athletics')).toBeTruthy()
	expect(screen.getByText('Wellness Center')).toBeTruthy()
})

test('omits the organisation section when no source names one', async () => {
	await render(picker({organizations: []}))
	expect(screen.queryByText('ORGANIZATION')).toBeNull()
})

test('offers to clear the filter', async () => {
	await render(picker({filter: {axis: 'category', value: 'Athletics'}}))
	expect(screen.getByText('All Events')).toBeTruthy()
})
