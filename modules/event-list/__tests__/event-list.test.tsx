import React from 'react'
import moment from 'moment-timezone'
import {describe, expect, jest, test} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react-native'
import type {EventType} from '@frogpond/event-type'

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

function makeEvent(overrides: Partial<EventType> = {}): EventType {
	return {
		title: 'New Faculty Orientation',
		description: 'Seminars across campus.',
		location: 'Kings Dining',
		startTime: moment('2026-08-17T07:45:00Z'),
		endTime: moment('2026-08-17T11:30:00Z'),
		isOngoing: false,
		links: [],
		config: {startTime: true, endTime: true, subtitle: 'location'},
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

	test('renders a row with its title and trailing start/end times', async () => {
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

		expect(screen.getByText('New Faculty Orientation')).toBeTruthy()
		expect(screen.getByText('Kings Dining')).toBeTruthy()
	})

	test('an all-day row shows all-day instead of times', async () => {
		let entry = makeEntry({
			startTime: moment('2026-08-17T00:00:00Z'),
			endTime: moment('2026-08-18T00:00:00Z'),
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

	// Calendar.app pairs leading and trailing text line by line: the title
	// truncates against the start time, the location against the end time. A row
	// with no end time therefore still shows its location, on a line whose full
	// width is its own -- which is the point of the pairing.
	test('still shows the location when there is no end time', async () => {
		let entry = makeEntry({
			location: 'Middendorf Animal Hospital And Laser Centre',
			config: {startTime: true, endTime: false, subtitle: 'location'},
		})
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

		expect(screen.getByText('Middendorf Animal Hospital And Laser Centre')).toBeTruthy()
		expect(screen.getByText(start)).toBeTruthy()
		expect(screen.queryByText(end)).toBeNull()
	})

	test('shows an all-day row’s location too', async () => {
		let entry = makeEntry({
			startTime: moment('2026-08-17T00:00:00'),
			endTime: moment('2026-08-18T00:00:00'),
			location: 'Downtown Northfield, MN',
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

	test('pull-to-refresh calls onRefresh', async () => {
		let onRefresh = jest.fn()

		await render(
			<EventList
				events={[makeEntry()]}
				failed={[]}
				now={NOW}
				onPressEvent={jest.fn()}
				onRefresh={onRefresh}
				poweredBy={POWERED_BY}
				refreshing={false}
				sources={[STOLAF_SOURCE]}
			/>,
		)

		await fireEvent.press(screen.getByTestId('list-refresh-trigger'))

		expect(onRefresh).toHaveBeenCalled()
	})

	test('a row is tinted with its own calendar’s colour', async () => {
		let sources = [
			{id: 'stolaf', title: 'St. Olaf', color: 'blue', kind: 'remote' as const},
			{id: 'northfield', title: 'Northfield', color: 'indigo', kind: 'remote' as const},
		]
		let events = [
			{sourceId: 'stolaf', key: 'a', event: makeEvent({title: 'Olaf thing'})},
			{sourceId: 'northfield', key: 'b', event: makeEvent({title: 'Northfield thing'})},
		]

		await render(
			<EventList
				events={events}
				failed={[]}
				now={NOW}
				onPressEvent={jest.fn()}
				onRefresh={jest.fn()}
				poweredBy={POWERED_BY}
				refreshing={false}
				sources={sources}
			/>,
		)

		expect(screen.getByText('Olaf thing')).toBeTruthy()
		expect(screen.getByText('Northfield thing')).toBeTruthy()

		let olafBar = screen.getByTestId('event-list-row-bar-Olaf thing')
		let northfieldBar = screen.getByTestId('event-list-row-bar-Northfield thing')

		expect(olafBar.props.modifiers).toContainEqual({$type: 'background', value: 'blue'})
		expect(northfieldBar.props.modifiers).toContainEqual({$type: 'background', value: 'indigo'})
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
