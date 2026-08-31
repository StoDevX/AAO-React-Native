import React from 'react'
import moment from 'moment-timezone'
import {describe, expect, jest, test} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react-native'
import {deriveDayFlags, type EventType} from '@frogpond/event-type'

import {EventList} from '../event-list'
import {listTimeLines} from '../times'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./expo-ui-mock') as typeof import('./expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./expo-ui-mock') as typeof import('./expo-ui-mock')
})

const POWERED_BY = {title: 'Powered by the St. Olaf calendar', href: 'https://example.com'}
const NOW = moment('2026-08-17T12:00:00Z')

const STOLAF_SOURCE = {id: 'stolaf', title: 'St. Olaf', color: 'blue', kind: 'remote' as const}

/**
 * What every parser writes for an all-day event, and what `times.ts` reads to
 * decide one: neither edge carries a meaningful time.
 */
const ALL_DAY = {startTime: false, endTime: false, subtitle: 'location'} as const

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
		config,
		...overrides,
	}
}

function makeEntry(overrides: Partial<EventType> = {}) {
	return {sourceId: 'stolaf', key: 'a', event: makeEvent(overrides)}
}

describe('EventList', () => {
	test('renders a section header for the event’s day', async () => {
		await render(
			<EventList
				events={[makeEntry()]}
				failed={[]}
				now={NOW}
				onPressEvent={jest.fn()}
				onRefresh={jest.fn()}
				poweredBy={POWERED_BY}
				refreshing={false}
				sources={[STOLAF_SOURCE]}
			/>,
		)

		expect(screen.getByText('Monday – Aug 17')).toBeTruthy()
	})

	test('an all-day row shows all-day instead of times', async () => {
		let entry = makeEntry({
			startTime: moment('2026-08-17T00:00:00Z'),
			endTime: moment('2026-08-18T00:00:00Z'),
			config: ALL_DAY,
		})

		await render(
			<EventList
				events={[entry]}
				failed={[]}
				now={NOW}
				onPressEvent={jest.fn()}
				onRefresh={jest.fn()}
				poweredBy={POWERED_BY}
				refreshing={false}
				sources={[STOLAF_SOURCE]}
			/>,
		)

		expect(screen.getByText('all-day')).toBeTruthy()
	})

	test('hides the start time when config.startTime is false', async () => {
		let entry = makeEntry({config: {startTime: false, endTime: true, subtitle: 'location'}})
		let {start, end} = listTimeLines(entry.event)

		await render(
			<EventList
				events={[entry]}
				failed={[]}
				now={NOW}
				onPressEvent={jest.fn()}
				onRefresh={jest.fn()}
				poweredBy={POWERED_BY}
				refreshing={false}
				sources={[STOLAF_SOURCE]}
			/>,
		)

		expect(screen.queryByText(start)).toBeNull()
		expect(screen.getByText(end)).toBeTruthy()
	})

	test('hides the end time when config.endTime is false', async () => {
		let entry = makeEntry({config: {startTime: true, endTime: false, subtitle: 'location'}})
		let {start, end} = listTimeLines(entry.event)

		await render(
			<EventList
				events={[entry]}
				failed={[]}
				now={NOW}
				onPressEvent={jest.fn()}
				onRefresh={jest.fn()}
				poweredBy={POWERED_BY}
				refreshing={false}
				sources={[STOLAF_SOURCE]}
			/>,
		)

		expect(screen.getByText(start)).toBeTruthy()
		expect(screen.queryByText(end)).toBeNull()
	})

	// A row whose second line has no trailing time still draws that line, so the
	// location does not go with the end time.
	test('shows an all-day row’s location too', async () => {
		let entry = makeEntry({
			startTime: moment('2026-08-17T00:00:00'),
			endTime: moment('2026-08-18T00:00:00'),
			location: 'Downtown Northfield, MN',
			config: ALL_DAY,
		})

		await render(
			<EventList
				events={[entry]}
				failed={[]}
				now={NOW}
				onPressEvent={jest.fn()}
				onRefresh={jest.fn()}
				poweredBy={POWERED_BY}
				refreshing={false}
				sources={[STOLAF_SOURCE]}
			/>,
		)

		expect(screen.getByText('all-day')).toBeTruthy()
		expect(screen.getByText('Downtown Northfield, MN')).toBeTruthy()
	})

	test('shows the empty state when there are no events', async () => {
		await render(
			<EventList
				events={[]}
				failed={[]}
				now={NOW}
				onPressEvent={jest.fn()}
				onRefresh={jest.fn()}
				poweredBy={POWERED_BY}
				refreshing={false}
				sources={[STOLAF_SOURCE]}
			/>,
		)

		expect(screen.getByText('No events.')).toBeTruthy()
	})

	test('shows the message notice instead of the list when given one', async () => {
		await render(
			<EventList
				events={[]}
				failed={[]}
				message="Something went wrong"
				now={NOW}
				onPressEvent={jest.fn()}
				onRefresh={jest.fn()}
				poweredBy={POWERED_BY}
				refreshing={false}
				sources={[STOLAF_SOURCE]}
			/>,
		)

		expect(screen.getByText('Something went wrong')).toBeTruthy()
	})

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
				poweredBy={POWERED_BY}
				refreshing={false}
				sources={[STOLAF_SOURCE]}
			/>,
		)

		await fireEvent.press(screen.getByText('New Faculty Orientation'))

		expect(onPressEvent).toHaveBeenCalledWith(entry)
	})

	test('a failed calendar is named while the others still render', async () => {
		let sources = [{id: 'stolaf', title: 'St. Olaf', color: 'blue', kind: 'remote' as const}]
		let failed = [{id: 'northfield', title: 'Northfield', color: 'indigo', kind: 'remote' as const}]

		await render(
			<EventList
				events={[{sourceId: 'stolaf', key: 'a', event: makeEvent({title: 'Olaf thing'})}]}
				failed={failed}
				now={NOW}
				onPressEvent={jest.fn()}
				onRefresh={jest.fn()}
				poweredBy={POWERED_BY}
				refreshing={false}
				sources={sources}
			/>,
		)

		expect(screen.getByText('Olaf thing')).toBeTruthy()
		expect(screen.getByText(/Northfield/u)).toBeTruthy()
	})

	// If every enabled calendar errors, `events` is empty exactly like the
	// ordinary "nothing is on today" case -- the failure has to say so rather
	// than fall through to the same bare "No events."
	test('names the failed calendars when every one of them failed', async () => {
		let sources = [{id: 'stolaf', title: 'St. Olaf', color: 'blue', kind: 'remote' as const}]
		let failed = [{id: 'stolaf', title: 'St. Olaf', color: 'blue', kind: 'remote' as const}]

		await render(
			<EventList
				events={[]}
				failed={failed}
				now={NOW}
				onPressEvent={jest.fn()}
				onRefresh={jest.fn()}
				poweredBy={POWERED_BY}
				refreshing={false}
				sources={sources}
			/>,
		)

		expect(screen.getByText(/Could not load St\. Olaf/u)).toBeTruthy()
		expect(screen.queryByText('No events.')).toBeNull()
	})

	// The notice replaces the list, and the list is what carries
	// pull-to-refresh -- so without a button of its own there is no way back
	// from "aeroplane mode, one calendar, and it failed" short of leaving the
	// screen.
	test('the every-calendar-failed notice can be retried', async () => {
		let source = {id: 'stolaf', title: 'St. Olaf', color: 'blue', kind: 'remote' as const}
		let onRefresh = jest.fn()

		await render(
			<EventList
				events={[]}
				failed={[source]}
				now={NOW}
				onPressEvent={jest.fn()}
				onRefresh={onRefresh}
				poweredBy={POWERED_BY}
				refreshing={false}
				sources={[source]}
			/>,
		)

		await fireEvent.press(screen.getByText('Try Again'))

		expect(onRefresh).toHaveBeenCalled()
	})

	test('the empty notice can be retried', async () => {
		let onRefresh = jest.fn()

		await render(
			<EventList
				events={[]}
				failed={[]}
				now={NOW}
				onPressEvent={jest.fn()}
				onRefresh={onRefresh}
				poweredBy={POWERED_BY}
				refreshing={false}
				sources={[STOLAF_SOURCE]}
			/>,
		)

		await fireEvent.press(screen.getByText('Try Again'))

		expect(onRefresh).toHaveBeenCalled()
	})

	// Nothing to reload -- the way out is the picker, not a retry.
	test('the no-calendars notice offers no retry', async () => {
		await render(
			<EventList
				events={[]}
				failed={[]}
				now={NOW}
				onPressEvent={jest.fn()}
				onRefresh={jest.fn()}
				poweredBy={POWERED_BY}
				refreshing={false}
				sources={[]}
			/>,
		)

		expect(screen.queryByText('Try Again')).toBeNull()
	})

	// "Nothing is on" and "nothing is happening" look identical if both say
	// "No events."
	test('turning every calendar off says so, rather than looking empty', async () => {
		await render(
			<EventList
				events={[]}
				failed={[]}
				now={NOW}
				onPressEvent={jest.fn()}
				onRefresh={jest.fn()}
				poweredBy={POWERED_BY}
				refreshing={false}
				sources={[]}
			/>,
		)

		expect(screen.getByText(/No calendars/u)).toBeTruthy()
	})
})
