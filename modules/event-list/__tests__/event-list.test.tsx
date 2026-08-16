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

describe('EventList', () => {
	test('renders a section header for the event’s day', async () => {
		await render(
			<EventList
				events={[makeEvent()]}
				now={NOW}
				onPressEvent={jest.fn()}
				onRefresh={jest.fn()}
				poweredBy={POWERED_BY}
				refreshing={false}
			/>,
		)

		expect(screen.getByText('Monday – Aug 17')).toBeTruthy()
	})

	test('renders a row with its title and trailing start/end times', async () => {
		await render(
			<EventList
				events={[makeEvent()]}
				now={NOW}
				onPressEvent={jest.fn()}
				onRefresh={jest.fn()}
				poweredBy={POWERED_BY}
				refreshing={false}
			/>,
		)

		expect(screen.getByText('New Faculty Orientation')).toBeTruthy()
		expect(screen.getByText('Kings Dining')).toBeTruthy()
	})

	test('an all-day row shows all-day instead of times', async () => {
		let event = makeEvent({
			startTime: moment('2026-08-17T00:00:00Z'),
			endTime: moment('2026-08-18T00:00:00Z'),
		})

		await render(
			<EventList
				events={[event]}
				now={NOW}
				onPressEvent={jest.fn()}
				onRefresh={jest.fn()}
				poweredBy={POWERED_BY}
				refreshing={false}
			/>,
		)

		expect(screen.getByText('all-day')).toBeTruthy()
	})

	test('hides the start time when config.startTime is false', async () => {
		let event = makeEvent({config: {startTime: false, endTime: true, subtitle: 'location'}})
		let {start, end} = listTimeLines(event)

		await render(
			<EventList
				events={[event]}
				now={NOW}
				onPressEvent={jest.fn()}
				onRefresh={jest.fn()}
				poweredBy={POWERED_BY}
				refreshing={false}
			/>,
		)

		expect(screen.queryByText(start)).toBeNull()
		expect(screen.getByText(end)).toBeTruthy()
	})

	test('hides the end time when config.endTime is false', async () => {
		let event = makeEvent({config: {startTime: true, endTime: false, subtitle: 'location'}})
		let {start, end} = listTimeLines(event)

		await render(
			<EventList
				events={[event]}
				now={NOW}
				onPressEvent={jest.fn()}
				onRefresh={jest.fn()}
				poweredBy={POWERED_BY}
				refreshing={false}
			/>,
		)

		expect(screen.getByText(start)).toBeTruthy()
		expect(screen.queryByText(end)).toBeNull()
	})

	test('shows the empty state when there are no events', async () => {
		await render(
			<EventList
				events={[]}
				now={NOW}
				onPressEvent={jest.fn()}
				onRefresh={jest.fn()}
				poweredBy={POWERED_BY}
				refreshing={false}
			/>,
		)

		expect(screen.getByText('No events.')).toBeTruthy()
	})

	test('shows the message notice instead of the list when given one', async () => {
		await render(
			<EventList
				events={[]}
				message="Something went wrong"
				now={NOW}
				onPressEvent={jest.fn()}
				onRefresh={jest.fn()}
				poweredBy={POWERED_BY}
				refreshing={false}
			/>,
		)

		expect(screen.getByText('Something went wrong')).toBeTruthy()
	})

	test('tapping a row calls onPressEvent with that event', async () => {
		let event = makeEvent()
		let onPressEvent = jest.fn()

		await render(
			<EventList
				events={[event]}
				now={NOW}
				onPressEvent={onPressEvent}
				onRefresh={jest.fn()}
				poweredBy={POWERED_BY}
				refreshing={false}
			/>,
		)

		await fireEvent.press(screen.getByText('New Faculty Orientation'))

		expect(onPressEvent).toHaveBeenCalledWith(event)
	})

	test('pull-to-refresh calls onRefresh', async () => {
		let onRefresh = jest.fn()

		await render(
			<EventList
				events={[makeEvent()]}
				now={NOW}
				onPressEvent={jest.fn()}
				onRefresh={onRefresh}
				poweredBy={POWERED_BY}
				refreshing={false}
			/>,
		)

		await fireEvent.press(screen.getByTestId('list-refresh-trigger'))

		expect(onRefresh).toHaveBeenCalled()
	})
})
