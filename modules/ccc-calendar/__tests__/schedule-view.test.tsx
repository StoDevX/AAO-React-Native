import * as React from 'react'
import {beforeEach, describe, expect, jest, test} from '@jest/globals'
import {render, screen} from '@testing-library/react-native'
import type {UseQueryResult} from '@tanstack/react-query'
import moment from 'moment-timezone'

import {OFFLINE_MESSAGE, ScheduleView} from '../schedule-view'
import type {SourcedEvent} from '../sources'

type ListProps = {
	events: SourcedEvent[]
	failed: {id: string}[]
	isLoading?: boolean
	message?: string
}

// The list itself draws through `@expo/ui`, which Jest cannot lay out. What is
// decided here is which props the schedule hands it, so the stand-in records
// them.
const listProps: ListProps[] = []
jest.mock('@frogpond/event-list', () => ({
	EventList: {
		EventList: (props: ListProps) => {
			listProps.push(props)
			return null
		},
	},
}))

const EVENT = {
	sourceId: 'schedule',
	key: 'a',
	event: {title: 'Morning Show', startTime: moment(), endTime: moment()},
} as unknown as SourcedEvent

function query(overrides: Partial<UseQueryResult<SourcedEvent[]>>) {
	return {
		data: undefined,
		error: null,
		isError: false,
		isPending: false,
		isRefetching: false,
		fetchStatus: 'idle',
		refetch: jest.fn(),
		...overrides,
	} as unknown as UseQueryResult<SourcedEvent[]>
}

function lastListProps(): ListProps | undefined {
	return listProps.at(-1)
}

beforeEach(() => {
	listProps.length = 0
})

describe('ScheduleView', () => {
	test('tells the list it is loading while the first fetch runs', async () => {
		await render(
			<ScheduleView
				onPressEvent={jest.fn()}
				query={query({isPending: true, fetchStatus: 'fetching'})}
			/>,
		)

		expect(lastListProps()?.isLoading).toBe(true)
		expect(lastListProps()?.message).toBeUndefined()
	})

	test('says the device is offline when the first fetch is paused', async () => {
		await render(
			<ScheduleView
				onPressEvent={jest.fn()}
				query={query({isPending: true, fetchStatus: 'paused'})}
			/>,
		)

		expect(lastListProps()?.message).toBe(OFFLINE_MESSAGE)
	})

	test('keeps the saved schedule when a refresh fails', async () => {
		await render(
			<ScheduleView
				onPressEvent={jest.fn()}
				query={query({isError: true, error: new Error('down'), data: [EVENT]})}
			/>,
		)

		expect(screen.queryByText(/A problem occured/u)).toBeNull()
		expect(lastListProps()?.events).toEqual([EVENT])
		expect(lastListProps()?.failed).toHaveLength(1)
	})

	test('shows the error when a fetch fails with nothing saved', async () => {
		await render(
			<ScheduleView
				onPressEvent={jest.fn()}
				query={query({isError: true, error: new Error('down')})}
			/>,
		)

		expect(screen.getByText(/A problem occured while loading: Error: down/u)).toBeTruthy()
		expect(listProps).toHaveLength(0)
	})

	test('reports no failure once the schedule has loaded', async () => {
		await render(<ScheduleView onPressEvent={jest.fn()} query={query({data: [EVENT]})} />)

		expect(lastListProps()?.failed).toEqual([])
		expect(lastListProps()?.isLoading).toBe(false)
	})
})
