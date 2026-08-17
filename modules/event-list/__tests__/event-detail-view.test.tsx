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
	getCalendarPermissions: jest.fn(() => Promise.resolve({status: 'granted', canAskAgain: true})),
	requestCalendarPermissions: jest.fn(() => Promise.resolve({status: 'granted'})),
	getDefaultCalendarSync: jest.fn(() => ({
		id: 'cal-1',
		createEvent: jest.fn(() => Promise.resolve({id: 'event-1'})),
	})),
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

	// The one test that drives `AddToCalendar`'s state machine, and the only one
	// that renders a `Section` footer -- a slot where a bare string kills the app
	// at mount, which the stand-in throws on.
	test('it offers an add-to-calendar button', async () => {
		await render(<EventDetail color="#ff0000" event={makeEvent()} poweredBy={POWERED_BY} />)

		await fireEvent.press(screen.getByLabelText('Add to calendar'))
		await waitFor(() =>
			expect(screen.getByText('Event has been added to your calendar')).toBeTruthy(),
		)
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
