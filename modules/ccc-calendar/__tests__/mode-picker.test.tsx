import * as React from 'react'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {CalendarModePicker} from '../mode-picker'

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

test('offers both modes', async () => {
	await render(<CalendarModePicker mode="day" onSelectMode={jest.fn()} />)
	expect(screen.getByText('Day')).toBeTruthy()
	expect(screen.getByText('Upcoming')).toBeTruthy()
})

test('offers nothing else', async () => {
	await render(<CalendarModePicker mode="day" onSelectMode={jest.fn()} />)
	expect(screen.queryByText('Timeline')).toBeNull()
})

test('choosing the other mode reports it', async () => {
	let onSelectMode = jest.fn()
	await render(<CalendarModePicker mode="day" onSelectMode={onSelectMode} />)

	fireEvent.press(screen.getByText('Upcoming'))

	expect(onSelectMode).toHaveBeenCalledWith('upcoming')
})

test('choosing the mode already in use reports it anyway', async () => {
	let onSelectMode = jest.fn()
	await render(<CalendarModePicker mode="day" onSelectMode={onSelectMode} />)

	fireEvent.press(screen.getByText('Day'))

	expect(onSelectMode).toHaveBeenCalledWith('day')
})
