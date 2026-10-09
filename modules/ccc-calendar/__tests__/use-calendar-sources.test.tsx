import * as React from 'react'
import {describe, expect, test} from '@jest/globals'
import {act, renderHook} from '@testing-library/react-native'
import {Provider} from 'react-redux'
import {configureStore} from '@reduxjs/toolkit'

import {reducer as settings} from '../../../source/redux/parts/settings'
import {useCalendarSource, useCalendarSources} from '../use-calendar-sources'

function wrapper({children}: {children: React.ReactNode}) {
	let store = configureStore({reducer: {settings}})
	return <Provider store={store}>{children}</Provider>
}

describe('useCalendarSources', () => {
	test('toggling a source changes what is enabled', async () => {
		let {result} = await renderHook(() => useCalendarSources(['stolaf']), {wrapper})

		await act(() => {
			result.current.toggle('stolaf')
		})

		// Switching off the last calendar leaves none enabled. The list draws its
		// own "no calendars are showing" notice for that, which is a truthful
		// answer -- quietly re-enabling a calendar the user just switched off
		// would read as a broken toggle.
		expect(result.current.enabled).toEqual([])
	})

	// A source id the settings still remember -- a device calendar enabled
	// before those were dropped, or 'uitest' left over from an old test run -- names
	// no calendar the app has, and must not reach the list as one.
	test('an enabled id naming no calendar is left out', async () => {
		let store = configureStore({reducer: {settings}})
		let withStore = ({children}: {children: React.ReactNode}) => (
			<Provider store={store}>{children}</Provider>
		)
		let {result} = await renderHook(() => useCalendarSources(['stolaf']), {wrapper: withStore})

		await act(() => {
			result.current.toggle('device:ABC')
		})

		expect(result.current.enabled.map((s) => s.id)).toEqual(['stolaf'])
	})

	// The detail screen arrives knowing only an id, and must reach the same
	// colour the list used.
	test('a source id resolves to its source', async () => {
		let {result} = await renderHook(() => useCalendarSource('wiki-monkeys'), {wrapper})

		expect(result.current?.title).toBe('Wiki Monkeys')
	})
})
