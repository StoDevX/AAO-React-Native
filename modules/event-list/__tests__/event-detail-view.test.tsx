import React from 'react'
import moment from 'moment-timezone'
import {describe, expect, test} from '@jest/globals'
import {fireEvent, render, screen, waitFor} from '@testing-library/react-native'
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
// `AddToCalendar` imports `modules/add-to-device-calendar/lib.ts`, which calls
// into `@sentry/react-native` on its error path and `expo-calendar` for
// native calendar access. Neither is available under Jest -- the same reason
// `modules/add-to-device-calendar/__tests__/lib.test.ts` mocks both.
jest.mock('@sentry/react-native', () => ({captureException: jest.fn()}))
jest.mock('expo-calendar', () => ({
	getCalendarPermissionsAsync: jest.fn(() =>
		Promise.resolve({status: 'granted', canAskAgain: true}),
	),
	requestCalendarPermissionsAsync: jest.fn(() => Promise.resolve({status: 'granted'})),
	getDefaultCalendarAsync: jest.fn(() => Promise.resolve({id: 'cal-1'})),
	createEventAsync: jest.fn(() => Promise.resolve('event-1')),
}))
// `AddToCalendar`'s own component (not `lib.ts`) also pulls in `delay`, an
// ESM-only package outside jest.config.js's transform allowlist.
jest.mock('delay', () => ({
	__esModule: true,
	default: jest.fn(() => Promise.resolve()),
}))

const POWERED_BY = {title: 'Powered by the St. Olaf calendar', href: 'https://example.com'}

function makeEvent(overrides: Partial<EventType> = {}): EventType {
	return {
		title: 'New Faculty Orientation',
		description: 'Seminars across campus.',
		location: 'Kings Dining',
		startTime: moment('2026-08-17T09:00:00Z'),
		endTime: moment('2026-08-20T18:00:00Z'),
		isOngoing: false,
		links: [],
		config: {startTime: true, endTime: true, subtitle: 'location'},
		...overrides,
	}
}

describe('EventDetail', () => {
	test('it shows the location and description sections', async () => {
		await render(<EventDetail color="#ff0000" event={makeEvent()} poweredBy={POWERED_BY} />)

		// No assertion on the event's name: it is the screen's native large title,
		// set by the route, not something this component renders. The date block
		// is what proves the header is still wired in.
		expect(screen.getByTestId('event-detail-times')).toBeTruthy()
		expect(screen.getByText('Monday, August 17, 2026', {exact: false})).toBeTruthy()
		expect(screen.getByText('Location')).toBeTruthy()
		expect(screen.getByText('Kings Dining')).toBeTruthy()
		expect(screen.getByText('Description')).toBeTruthy()
		expect(screen.getByText('Seminars across campus.')).toBeTruthy()
	})

	// A device all-day event as EventKit hands it over: 00:00:00 to 23:59:59,
	// both edges flagged meaningless. While all-day was decided by a 24-hour
	// duration this rendered as `From 12 AM ... to 11:59 PM ...`.
	test('an EventKit all-day event reads as all day, not as a midnight range', async () => {
		let event = makeEvent({
			title: 'Labor Day',
			startTime: moment('2026-09-07T00:00:00'),
			endTime: moment('2026-09-07T23:59:59'),
			config: {startTime: false, endTime: false, subtitle: 'location'},
		})

		await render(<EventDetail color="#ff0000" event={event} poweredBy={POWERED_BY} />)

		expect(screen.getByText('All day Monday, September 7, 2026')).toBeTruthy()
		expect(screen.queryByText(/12 AM/u)).toBeNull()
		expect(screen.queryByText(/11:59 PM/u)).toBeNull()
	})

	test('it omits a section whose field is empty', async () => {
		await render(
			<EventDetail color="#ff0000" event={makeEvent({location: ''})} poweredBy={POWERED_BY} />,
		)

		expect(screen.queryByText('Location')).toBeNull()
		expect(screen.getByText('Description')).toBeTruthy()
	})

	test('it shows the powered-by footer', async () => {
		await render(<EventDetail color="#ff0000" event={makeEvent()} poweredBy={POWERED_BY} />)

		expect(screen.getByText('Powered by the St. Olaf calendar')).toBeTruthy()
	})

	test('it offers an add-to-calendar button', async () => {
		await render(<EventDetail color="#ff0000" event={makeEvent()} poweredBy={POWERED_BY} />)

		await fireEvent.press(screen.getByLabelText('Add to calendar'))
		await waitFor(() =>
			expect(screen.getByText('Event has been added to your calendar')).toBeTruthy(),
		)
	})

	test('it lists each event link', async () => {
		let links = ['https://example.com/one', 'https://example.com/two']
		await render(<EventDetail color="#ff0000" event={makeEvent({links})} poweredBy={POWERED_BY} />)

		expect(screen.getByText('Links')).toBeTruthy()
		expect(screen.getByText('https://example.com/one')).toBeTruthy()
		expect(screen.getByText('https://example.com/two')).toBeTruthy()
	})

	test('it omits the links section when there are none', async () => {
		await render(
			<EventDetail color="#ff0000" event={makeEvent({links: []})} poweredBy={POWERED_BY} />,
		)

		expect(screen.queryByText('Links')).toBeNull()
	})
})
