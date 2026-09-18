import * as React from 'react'
import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {renderHook, waitFor} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import moment from 'moment-timezone'

import {UITEST_FROZEN_DATE} from '@frogpond/timer'

import type {WireEvent} from '../../../../modules/ccc-calendar/parsers/events'
import {getRunner} from '../../client'
import {ensureSchema} from '../../schema'
import {openTestDatabase} from '../../testing/harness'
import {dayWindow, useEvent, useOccurrences} from '../read'
import {retentionFor, writeSource} from '../write'

// `read.ts` reports a failed read to Sentry, which ships ESM-only and cannot
// load under Jest.
jest.mock('@sentry/react-native', () => ({captureException: jest.fn()}))
// `client.ts` opens `expo-sqlite`, a native module with nothing to bind to
// here. The hooks read from a real in-memory SQLite database instead.
jest.mock('../../client', () => ({getRunner: jest.fn()}))
// Already the default in `scripts/jest-setup.js`, restated because these
// tests are about the frozen clock UI testing turns on.
jest.mock('@frogpond/launch-arguments', () => ({isUITesting: true}))

/** What the app believes the time is: the date UI tests freeze the clock at. */
const APP_NOW = moment(UITEST_FROZEN_DATE)

/** What the device's clock says: a week after Orientation finished. */
const DEVICE_NOW = new Date('2026-09-17T09:00:00-05:00')

const ORIENTATION: WireEvent = {
	dataSource: 'uitest',
	startTime: '2026-09-01T09:00:00-05:00',
	endTime: '2026-09-12T17:00:00-05:00',
	isAllDay: false,
	isMultiDay: true,
	isSameInstant: false,
	title: 'Fall Semester Orientation',
	description: '',
	location: '',
	isOngoing: false,
	links: [],
	categories: [],
	config: {startTime: true, endTime: true, subtitle: 'location'},
}

const trackedQueryClients: QueryClient[] = []

function wrapper({children}: {children: React.ReactNode}) {
	let client = new QueryClient({defaultOptions: {queries: {retry: false}}})
	trackedQueryClients.push(client)
	return React.createElement(QueryClientProvider, {client}, children)
}

beforeEach(() => {
	let runner = openTestDatabase()
	ensureSchema(runner, 'test')
	writeSource(runner, 'uitest', 0, [ORIENTATION], retentionFor(APP_NOW.toDate()))
	jest.mocked(getRunner).mockReturnValue(runner)

	jest.useFakeTimers({now: DEVICE_NOW, advanceTimers: true})
})

afterEach(() => {
	jest.useRealTimers()
	for (let client of trackedQueryClients) {
		client.clear()
	}
	trackedQueryClients.length = 0
})

// Day mode picks its day from the app's clock. An event judged ongoing by a
// different clock lands on the wrong days: under UI testing, an event that
// spans the frozen day but has finished by the device's date drops off it.
describe('isOngoing follows the app clock, not the device clock', () => {
	test('in the window the list reads', async () => {
		let {result} = await renderHook(
			() =>
				useOccurrences({window: dayWindow(APP_NOW.toDate()), sourceIds: ['uitest'], filters: []}),
			{wrapper},
		)

		await waitFor(() => expect(result.current.events).toHaveLength(1))
		expect(result.current.events[0].event.isOngoing).toBe(true)
	})

	test('in the single event the detail screen reads', async () => {
		let {result} = await renderHook(
			() => useEvent('uitest', `2026-09-01T14:00:00.000Z|${ORIENTATION.title}`, ['uitest']),
			{wrapper},
		)

		await waitFor(() => expect(result.current.event).toBeDefined())
		expect(result.current.event?.isOngoing).toBe(true)
	})
})
