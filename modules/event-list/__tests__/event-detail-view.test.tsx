import React from 'react'
import moment from 'moment-timezone'
import {describe, expect, test} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react-native'
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
		await render(<EventDetail event={makeEvent()} poweredBy={POWERED_BY} />)

		expect(screen.getByText('Location')).toBeTruthy()
		expect(screen.getByText('Kings Dining')).toBeTruthy()
		expect(screen.getByText('Description')).toBeTruthy()
		expect(screen.getByText('Seminars across campus.')).toBeTruthy()
	})

	test('it omits a section whose field is empty', async () => {
		await render(<EventDetail event={makeEvent({location: ''})} poweredBy={POWERED_BY} />)

		expect(screen.queryByText('Location')).toBeNull()
		expect(screen.getByText('Description')).toBeTruthy()
	})

	test('it shows the powered-by footer', async () => {
		await render(<EventDetail event={makeEvent()} poweredBy={POWERED_BY} />)

		expect(screen.getByText('Powered by the St. Olaf calendar')).toBeTruthy()
	})

	test('it offers an add-to-calendar button', async () => {
		await render(<EventDetail event={makeEvent()} poweredBy={POWERED_BY} />)

		fireEvent.press(screen.getByLabelText('Add to calendar'))
		expect(screen.getByLabelText('Add to calendar')).toBeTruthy()
	})
})
