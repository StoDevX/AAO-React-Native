import * as React from 'react'
import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {fireEvent, render, screen, waitFor, within} from '@testing-library/react-native'
import {Provider} from 'react-redux'
import {configureStore} from '@reduxjs/toolkit'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'

import {reducer as settings} from '../../../source/redux/parts/settings'
import {CalendarPicker} from '../calendar-picker'

jest.mock('@react-native-community/netinfo', () =>
	// oxlint-disable-next-line typescript/no-require-imports
	require('@react-native-community/netinfo/jest/netinfo-mock'),
)

// The real toolbar renders nothing into the view tree -- it registers header
// items with the navigator through context -- so there is nothing to assert
// against unless the slots are stood in for. These stand-ins render each menu
// as a labelled container and each action as pressable text carrying its
// `isOn` state, which is exactly the structure this component decides on.
jest.mock('expo-router', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	let {Text, View} = require('react-native')
	// oxlint-disable-next-line typescript/no-require-imports
	let react = require('react')

	// Each slot is annotated inline: `jest.mock`'s factory may not name a type
	// alias, since the hoisting check reads the identifier before TypeScript
	// erases it.
	let Menu = ({children, title}: {children?: React.ReactNode; title?: string}) =>
		react.createElement(View, {testID: title ?? 'menu'}, children)

	let MenuAction = ({
		children,
		isOn,
		onPress,
	}: {
		children?: React.ReactNode
		isOn?: boolean
		onPress?: () => void
	}) =>
		react.createElement(Text, {accessibilityState: {selected: Boolean(isOn)}, onPress}, children)

	let Label = ({children}: {children?: string}) => react.createElement(Text, null, children)

	let Spacer = () => react.createElement(View, {testID: 'toolbar-spacer'})

	let Toolbar = Object.assign(
		({children, placement}: {children?: React.ReactNode; placement?: string}) =>
			react.createElement(View, {testID: `toolbar-${placement ?? 'bottom'}`}, children),
		{Label, Menu, MenuAction, Spacer},
	)

	return {Stack: {Toolbar}}
})

const mockGetFullCalendarAccess = jest.fn(() =>
	Promise.resolve({status: 'undetermined', granted: false}),
)
const mockRequestFullCalendarAccess = jest.fn(() =>
	Promise.resolve({status: 'granted', granted: true}),
)
const mockGetCalendars = jest.fn(() =>
	Promise.resolve([{id: 'ABC', title: 'Birthdays', color: '#34C759'}]),
)

jest.mock('../device-calendar', () => ({
	getFullCalendarAccess: () => mockGetFullCalendarAccess(),
	requestFullCalendarAccess: () => mockRequestFullCalendarAccess(),
}))
jest.mock('expo-calendar', () => ({
	EntityTypes: {EVENT: 'event'},
	getCalendars: () => mockGetCalendars(),
}))

const mockUseIsDevMode = jest.fn(() => false)
jest.mock('../../../source/lib/use-is-dev-mode', () => ({
	useIsDevMode: () => mockUseIsDevMode(),
}))

const trackedQueryClients: QueryClient[] = []

beforeEach(() => {
	mockGetFullCalendarAccess.mockClear()
	mockRequestFullCalendarAccess.mockClear()
	mockGetCalendars.mockClear()
})

afterEach(() => {
	for (let client of trackedQueryClients) {
		client.clear()
	}
	trackedQueryClients.length = 0
})

function wrapper({children}: {children: React.ReactNode}) {
	let store = configureStore({reducer: {settings}})
	let client = new QueryClient({defaultOptions: {queries: {retry: false}}})
	trackedQueryClients.push(client)
	return (
		<Provider store={store}>
			<QueryClientProvider client={client}>{children}</QueryClientProvider>
		</Provider>
	)
}

function isChecked(name: string): boolean {
	return Boolean(screen.getByText(name).props.accessibilityState?.selected)
}

describe('CalendarPicker', () => {
	test('outside dev mode it lists the app’s calendars with no groups', async () => {
		mockUseIsDevMode.mockReturnValue(false)
		await render(<CalendarPicker />, {wrapper})

		expect(screen.getByText('St. Olaf')).toBeTruthy()
		expect(screen.getByText('Northfield')).toBeTruthy()
		expect(screen.queryByTestId('All About Olaf')).toBeNull()
		expect(screen.queryByTestId('Device')).toBeNull()
	})

	test('the enabled calendars are the checked ones', async () => {
		mockUseIsDevMode.mockReturnValue(false)
		await render(<CalendarPicker />, {wrapper})

		expect(isChecked('St. Olaf')).toBe(true)
		expect(isChecked('Northfield')).toBe(false)
	})

	test('choosing a calendar checks it', async () => {
		mockUseIsDevMode.mockReturnValue(false)
		await render(<CalendarPicker />, {wrapper})

		await fireEvent.press(screen.getByText('Northfield'))

		expect(isChecked('Northfield')).toBe(true)
	})

	test('outside dev mode nothing offers the device’s calendars', async () => {
		mockUseIsDevMode.mockReturnValue(false)
		await render(<CalendarPicker />, {wrapper})

		expect(screen.queryByText('Show device calendars…')).toBeNull()
		expect(mockGetFullCalendarAccess).not.toHaveBeenCalled()
	})

	test('in dev mode the two groups are titled, and the device is only offered', async () => {
		mockUseIsDevMode.mockReturnValue(true)
		// The access check settles to the same falsy grant it started with, so
		// nothing on screen changes when it lands. A `Profiler` around the picker
		// is the only honest way to wait for that settling: without it, the
		// query's notification of that settling arrives after the test has
		// already finished, leaking its timer and updating a torn-down renderer.
		let commits = 0
		await render(
			<React.Profiler id="picker" onRender={() => (commits += 1)}>
				<CalendarPicker />
			</React.Profiler>,
			{wrapper},
		)

		expect(within(screen.getByTestId('All About Olaf')).getByText('St. Olaf')).toBeTruthy()
		expect(within(screen.getByTestId('Device')).getByText('Show device calendars…')).toBeTruthy()
		expect(mockGetCalendars).not.toHaveBeenCalled()

		await waitFor(() => {
			expect(mockGetFullCalendarAccess).toHaveBeenCalled()
			expect(commits).toBeGreaterThan(1)
		})
	})

	test('accepting the prompt lists the device’s calendars', async () => {
		mockUseIsDevMode.mockReturnValue(true)
		await render(<CalendarPicker />, {wrapper})

		await fireEvent.press(screen.getByText('Show device calendars…'))

		await waitFor(() => {
			expect(within(screen.getByTestId('Device')).getByText('Birthdays')).toBeTruthy()
		})
		expect(mockRequestFullCalendarAccess).toHaveBeenCalled()
	})
})
