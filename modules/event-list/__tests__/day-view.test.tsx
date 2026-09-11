import React from 'react'
import moment from 'moment-timezone'
import {describe, expect, jest, test} from '@jest/globals'
import {act, fireEvent, render, screen} from '@testing-library/react-native'
import {deriveDayFlags, type EventType} from '@frogpond/event-type'

import {DayView} from '../day-view'
import type {CalendarBodyHandle} from '../types'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./expo-ui-mock') as typeof import('./expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./expo-ui-mock') as typeof import('./expo-ui-mock')
})

// A Saturday, matching the clock the UI tests freeze -- 2026-09-05T12:00:00
// in America/Chicago, the zone that clock's `-05:00` offset resolves to in
// September. Built in that explicit zone, not the ambient one: a bare `...Z`
// string carries whatever zone the test happens to run in, which shifts
// which calendar day an event or `now` falls on and silently breaks the
// day-by-day assertions below on machines outside it.
const NOW = moment.tz('2026-09-05T12:00:00', 'America/Chicago')

const STOLAF_SOURCE = {id: 'stolaf', title: 'St. Olaf', color: 'blue', kind: 'remote' as const}

function makeEvent(title: string, start: string): EventType {
	let startTime = moment.tz(start, 'America/Chicago')
	let endTime = startTime.clone().add(1, 'hour')
	let {isMultiDay, isSameInstant} = deriveDayFlags(false, startTime.toDate(), endTime.toDate())

	return {
		title,
		description: '',
		location: 'Kings Dining',
		startTime,
		endTime,
		isAllDay: false,
		isMultiDay,
		isSameInstant,
		isOngoing: false,
		links: [],
		categories: [],
		config: {startTime: true, endTime: true, subtitle: 'location'},
	}
}

function entry(title: string, start: string) {
	return {sourceId: 'stolaf', key: title, event: makeEvent(title, start)}
}

function view(overrides = {}): React.ReactElement {
	return (
		<DayView
			events={[entry('Chapel', '2026-09-05T10:00:00')]}
			failed={[]}
			now={NOW}
			onPressEvent={jest.fn()}
			onRefresh={jest.fn()}
			refreshing={false}
			sources={[STOLAF_SOURCE]}
			{...overrides}
		/>
	)
}

describe('DayView', () => {
	test('opens on today', async () => {
		await render(view())
		expect(screen.getByText('Chapel')).toBeTruthy()
	})

	test('shows only the selected day’s events', async () => {
		await render(
			view({
				events: [entry('Chapel', '2026-09-05T10:00:00'), entry('Recital', '2026-09-07T10:00:00')],
			}),
		)
		expect(screen.getByText('Chapel')).toBeTruthy()
		expect(screen.queryByText('Recital')).toBeNull()
	})

	test('tapping a day shows that day’s events', async () => {
		await render(
			view({
				events: [entry('Chapel', '2026-09-05T10:00:00'), entry('Recital', '2026-09-07T10:00:00')],
			}),
		)

		await fireEvent.press(screen.getByTestId('day-cell-2026-09-07'))

		expect(screen.getByText('Recital')).toBeTruthy()
		expect(screen.queryByText('Chapel')).toBeNull()
	})

	test('an empty day says so and keeps the strip', async () => {
		// A later event so the strip's range reaches 2026-09-08 at all --
		// `deriveDays` only extends through the last event's week, and the
		// default Chapel event alone ends the range at 09-05.
		await render(
			view({
				events: [entry('Chapel', '2026-09-05T10:00:00'), entry('Recital', '2026-09-10T10:00:00')],
			}),
		)

		await fireEvent.press(screen.getByTestId('day-cell-2026-09-08'))

		// The notice names the day it is empty for, so match its opening.
		expect(screen.getByText(/^Nothing on /u)).toBeTruthy()
		expect(screen.getByTestId('day-cell-2026-09-05')).toBeTruthy()
	})

	test('falls back to today when the chosen day drops out of a narrowed range', async () => {
		let {rerender} = await render(
			view({
				events: [entry('Chapel', '2026-09-05T10:00:00'), entry('Recital', '2026-09-19T10:00:00')],
			}),
		)

		await fireEvent.press(screen.getByTestId('day-cell-2026-09-15'))
		expect(screen.getByTestId('day-cell-2026-09-15').props.accessibilityState.selected).toBe(true)

		// Narrowing the events -- as switching a calendar off would -- shortens
		// the derived range past the chosen day. The strip and the content have
		// to keep agreeing even though nothing told either of them to.
		await rerender(view({events: [entry('Chapel', '2026-09-05T10:00:00')]}))

		expect(screen.getByText('Chapel')).toBeTruthy()
		expect(screen.getByTestId('day-cell-2026-09-05').props.accessibilityState.selected).toBe(true)
	})

	test('showToday returns to today’s events through the imperative handle', async () => {
		let ref = React.createRef<CalendarBodyHandle>()

		await render(
			<DayView
				ref={ref}
				events={[entry('Chapel', '2026-09-05T10:00:00'), entry('Recital', '2026-09-07T10:00:00')]}
				failed={[]}
				now={NOW}
				onPressEvent={jest.fn()}
				onRefresh={jest.fn()}
				refreshing={false}
				sources={[STOLAF_SOURCE]}
			/>,
		)

		await fireEvent.press(screen.getByTestId('day-cell-2026-09-07'))
		expect(screen.getByText('Recital')).toBeTruthy()

		await act(() => {
			ref.current?.showToday()
		})

		expect(screen.getByText('Chapel')).toBeTruthy()
		expect(screen.queryByText('Recital')).toBeNull()
	})

	test('names the failed calendars rather than looking empty', async () => {
		await render(view({events: [], failed: [STOLAF_SOURCE]}))
		expect(screen.getByText('Could not load St. Olaf.')).toBeTruthy()
	})

	test('says so when no calendars are on', async () => {
		await render(view({events: [], sources: []}))
		expect(
			screen.getByText('No calendars are showing. Choose some from the Calendars button below.'),
		).toBeTruthy()
	})
})
