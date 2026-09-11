import React from 'react'
import moment from 'moment-timezone'
import {describe, expect, jest, test} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react-native'
import {deriveDayFlags, type EventType} from '@frogpond/event-type'

import {EventList} from '../event-list'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../source/testing/expo-ui-mock') as typeof import('../../../source/testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../source/testing/expo-ui-mock') as typeof import('../../../source/testing/expo-ui-mock')
})

const NOW = moment('2026-08-17T12:00:00Z')

const STOLAF_SOURCE = {id: 'stolaf', title: 'St. Olaf', color: 'blue', kind: 'remote' as const}

function makeEvent(overrides: Partial<EventType> = {}): EventType {
	let startTime = overrides.startTime ?? moment('2026-08-17T07:45:00Z')
	let endTime = overrides.endTime ?? moment('2026-08-17T11:30:00Z')
	let config = overrides.config ?? {startTime: true, endTime: true, subtitle: 'location' as const}
	let isAllDay = !config.startTime && !config.endTime
	let {isMultiDay, isSameInstant} = deriveDayFlags(isAllDay, startTime.toDate(), endTime.toDate())

	return {
		title: 'New Faculty Orientation',
		description: 'Seminars across campus.',
		location: 'Kings Dining',
		startTime,
		endTime,
		isAllDay,
		isMultiDay,
		isSameInstant,
		isOngoing: false,
		links: [],
		categories: [],
		config,
		...overrides,
	}
}

function makeEntry(overrides: Partial<EventType> = {}) {
	return {sourceId: 'stolaf', key: 'a', event: makeEvent(overrides)}
}

/**
 * What is left is wiring: that the list connects its pieces to the screen.
 * Which notice an empty list earns is decided in `day-state.ts` and asserted
 * there; what a row's times read as is decided in `times.ts` and asserted
 * there. Both were once asserted here as well, through a stand-in for
 * `@expo/ui` that has no layout pass -- so they could say the right branch was
 * taken and not whether it drew anything.
 */
describe('EventList', () => {
	test('renders a section header for the event’s day', async () => {
		await render(
			<EventList
				events={[makeEntry()]}
				failed={[]}
				now={NOW}
				onPressEvent={jest.fn()}
				onRefresh={jest.fn()}
				refreshing={false}
				sources={[STOLAF_SOURCE]}
			/>,
		)

		expect(screen.getByText('Monday – Aug 17')).toBeTruthy()
	})

	// A row whose second line has no trailing time still draws that line, so the
	// location does not go with the end time.

	test('tapping a row calls onPressEvent with that event', async () => {
		let entry = makeEntry()
		let onPressEvent = jest.fn()

		await render(
			<EventList
				events={[entry]}
				failed={[]}
				now={NOW}
				onPressEvent={onPressEvent}
				onRefresh={jest.fn()}
				refreshing={false}
				sources={[STOLAF_SOURCE]}
			/>,
		)

		await fireEvent.press(screen.getByText('New Faculty Orientation'))

		expect(onPressEvent).toHaveBeenCalledWith(entry)
	})

	// If every enabled calendar errors, `events` is empty exactly like the
	// ordinary "nothing is on today" case -- the failure has to say so rather
	// than fall through to the same bare "No events."

	// The notice replaces the list, and the list is what carries
	// pull-to-refresh -- so without a button of its own there is no way back
	// from "aeroplane mode, one calendar, and it failed" short of leaving the
	// screen.

	// Nothing to reload -- the way out is the picker, not a retry.

	test('draws no day picker', async () => {
		await render(
			<EventList
				events={[makeEntry()]}
				failed={[]}
				now={NOW}
				onPressEvent={jest.fn()}
				onRefresh={jest.fn()}
				refreshing={false}
				sources={[STOLAF_SOURCE]}
			/>,
		)

		expect(screen.queryByTestId('day-cell-2026-08-17')).toBeNull()
	})

	// "Nothing is on" and "nothing is happening" look identical if both say
	// "No events."
})
