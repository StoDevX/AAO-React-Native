import * as React from 'react'
import {afterEach, describe, expect, test} from '@jest/globals'
import {act, renderHook} from '@testing-library/react-native'
import {Provider} from 'react-redux'
import {configureStore} from '@reduxjs/toolkit'

import {reducer as settings} from '../../../redux/parts/settings'
import {useCampusStore} from '../../campus/store'
import {useCampusCalendarSources} from '../use-campus-calendar'

function wrapper({children}: {children: React.ReactNode}) {
	return <Provider store={configureStore({reducer: {settings}})}>{children}</Provider>
}

afterEach(() => {
	useCampusStore.setState({campus: 'edu.stolaf'})
})

describe("the campus's calendars", () => {
	test("are St. Olaf's own and Presence on St. Olaf", async () => {
		useCampusStore.setState({campus: 'edu.stolaf'})
		let {result} = await renderHook(() => useCampusCalendarSources(), {wrapper})
		expect(result.current.all.map((source) => source.id)).toEqual(['stolaf', 'presence'])
	})

	test("follow a switch to Carleton's", async () => {
		useCampusStore.setState({campus: 'edu.stolaf'})
		let {result} = await renderHook(() => useCampusCalendarSources(), {wrapper})
		await act(() => {
			useCampusStore.setState({campus: 'edu.carleton'})
		})
		expect(result.current.all.map((source) => source.id)).toEqual(['carleton'])
	})

	test("are Wiki Monkeys' own on Wiki Monkeys", async () => {
		useCampusStore.setState({campus: 'example.college'})
		let {result} = await renderHook(() => useCampusCalendarSources(), {wrapper})
		expect(result.current.all.map((source) => source.id)).toEqual(['wiki-monkeys'])
	})
})
