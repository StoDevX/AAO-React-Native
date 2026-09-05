import React from 'react'
import moment from 'moment-timezone'
import {describe, expect, test} from '@jest/globals'
import {render, screen} from '@testing-library/react-native'
import type {EventType} from '@frogpond/event-type'

import {EventDetail} from '../event-detail-view'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./expo-ui-mock') as typeof import('./expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./expo-ui-mock') as typeof import('./expo-ui-mock')
})

const POWERED_BY = {title: 'Powered by the St. Olaf calendar', href: 'https://example.com'}

function makeEvent(overrides: Partial<EventType> = {}): EventType {
	return {
		title: 'New Faculty Orientation',
		description: 'Seminars across campus.',
		location: 'Kings Dining',
		startTime: moment('2026-08-17T09:00:00Z'),
		endTime: moment('2026-08-20T18:00:00Z'),
		isAllDay: false,
		isMultiDay: true,
		isSameInstant: false,
		isOngoing: false,
		links: [],
		categories: [],
		config: {startTime: true, endTime: true, subtitle: 'location'},
		...overrides,
	}
}

describe('EventDetail', () => {
	// The event's own times, rather than hand-fed lines: this is what proves the
	// masthead is wired to `detailTimeLines`. How a line reads is settled in
	// times.test.ts, and how it is laid out is not something Jest can see.
	test('it dates the masthead from the event', async () => {
		await render(<EventDetail color="#ff0000" event={makeEvent()} poweredBy={POWERED_BY} />)

		expect(screen.getByText('Monday, August 17, 2026', {exact: false})).toBeTruthy()
	})

	test('it omits a section whose field is empty', async () => {
		await render(
			<EventDetail color="#ff0000" event={makeEvent({location: ''})} poweredBy={POWERED_BY} />,
		)

		expect(screen.queryByText('Location')).toBeNull()
		expect(screen.getByText('Description')).toBeTruthy()
	})

	test('it shows a links section when the event has links', async () => {
		let links = ['https://example.com/one', 'https://example.com/two']
		await render(<EventDetail color="#ff0000" event={makeEvent({links})} poweredBy={POWERED_BY} />)

		expect(screen.getByText('Links')).toBeTruthy()
	})

	test('it omits the links section when there are none', async () => {
		await render(
			<EventDetail color="#ff0000" event={makeEvent({links: []})} poweredBy={POWERED_BY} />,
		)

		expect(screen.queryByText('Links')).toBeNull()
	})
})
