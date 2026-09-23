import {afterEach, describe, expect, it, jest} from '@jest/globals'
import * as Sentry from '@sentry/react-native'
import {createEventInCalendarAsync} from 'expo-calendar/legacy'
import moment from 'moment'
import type {EventType} from '@frogpond/event-type'
import {addToCalendar} from '../lib'

jest.mock('@sentry/react-native', () => ({captureException: jest.fn()}))
jest.mock('expo-calendar/legacy', () => ({createEventInCalendarAsync: jest.fn()}))

// The error path logs alongside reporting to Sentry. Captured rather than
// left to print, so a passing run stays quiet and the log itself is asserted.
let consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)

function dialogResult(action: string): ReturnType<typeof createEventInCalendarAsync> {
	return Promise.resolve({action, id: null} as Awaited<
		ReturnType<typeof createEventInCalendarAsync>
	>)
}

function generateEvent(overrides: Partial<EventType> = {}): EventType {
	return {
		title: 'Founders Day',
		description: 'A celebration',
		location: 'Buntrock',
		startTime: moment('2026-09-01T17:00:00Z'),
		endTime: moment('2026-09-01T19:00:00Z'),
		isAllDay: false,
		isMultiDay: false,
		isSameInstant: false,
		isOngoing: false,
		links: [],
		categories: [],
		config: {startTime: false, endTime: false, subtitle: 'description'},
		...overrides,
	}
}

describe('addToCalendar', () => {
	afterEach(() => {
		jest.clearAllMocks()
	})

	it('fills the system editor from the event', async () => {
		jest.mocked(createEventInCalendarAsync).mockReturnValue(dialogResult('saved'))

		await addToCalendar(generateEvent())

		expect(createEventInCalendarAsync).toHaveBeenCalledWith({
			title: 'Founders Day',
			startDate: new Date('2026-09-01T17:00:00Z'),
			endDate: new Date('2026-09-01T19:00:00Z'),
			allDay: false,
			location: 'Buntrock',
			notes: 'A celebration',
		})
	})

	it('passes an all-day event through as all-day', async () => {
		jest.mocked(createEventInCalendarAsync).mockReturnValue(dialogResult('saved'))

		await addToCalendar(generateEvent({isAllDay: true}))

		expect(createEventInCalendarAsync).toHaveBeenCalledWith(expect.objectContaining({allDay: true}))
	})

	it('opens the editor for an event with no location or notes', async () => {
		jest.mocked(createEventInCalendarAsync).mockReturnValue(dialogResult('saved'))

		let result = await addToCalendar(generateEvent({location: undefined, description: undefined}))

		expect(result).toBe('saved')
		expect(createEventInCalendarAsync).toHaveBeenCalledWith(
			expect.objectContaining({location: undefined, notes: undefined}),
		)
	})

	it('reports saved when the user saves the event', async () => {
		jest.mocked(createEventInCalendarAsync).mockReturnValue(dialogResult('saved'))

		expect(await addToCalendar(generateEvent())).toBe('saved')
	})

	it.each(['canceled', 'done', 'deleted'])(
		'reports cancelled when the editor closes with %s',
		async (action) => {
			jest.mocked(createEventInCalendarAsync).mockReturnValue(dialogResult(action))

			expect(await addToCalendar(generateEvent())).toBe('cancelled')
		},
	)

	it('reports error, to Sentry and the log, when the editor fails', async () => {
		let failure = new Error('EventDialogInProgressException')
		jest.mocked(createEventInCalendarAsync).mockRejectedValue(failure)

		expect(await addToCalendar(generateEvent())).toBe('error')
		expect(Sentry.captureException).toHaveBeenCalledWith(failure)
		expect(consoleErrorSpy).toHaveBeenCalledWith(failure)
	})
})
