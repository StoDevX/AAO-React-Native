import {afterEach, describe, expect, it, jest} from '@jest/globals'
import {Alert, Linking} from 'react-native'
import * as Sentry from '@sentry/react-native'
import * as Calendar from 'expo-calendar'
import moment from 'moment'
import type {EventType} from '@frogpond/event-type'
import {addToCalendar} from '../lib'

jest.mock('@sentry/react-native', () => ({captureException: jest.fn()}))
jest.mock('expo-calendar', () => ({
	getCalendarPermissions: jest.fn(),
	requestCalendarPermissions: jest.fn(),
	getDefaultCalendarSync: jest.fn(),
}))

let addEventWithForm = jest.fn<() => Promise<unknown>>()
let alertSpy = jest.spyOn(Alert, 'alert').mockReturnValue(undefined)
let openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true)
// The error path logs alongside reporting to Sentry. Captured rather than
// left to print, so a passing run stays quiet and the log itself is asserted.
let consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)

/**
 * `getDefaultCalendarSync` hands back an `ExpoCalendar` instance, and
 * `addEventWithForm` is a method on it. Only that one method is exercised
 * here, so the stand-in carries only that.
 */
function stubDefaultCalendar(): void {
	jest
		.mocked(Calendar.getDefaultCalendarSync)
		.mockReturnValue({id: 'cal-1', addEventWithForm} as unknown as Calendar.ExpoCalendar)
}

function permissions(
	status: string,
	canAskAgain: boolean,
): ReturnType<typeof Calendar.getCalendarPermissions> {
	return Promise.resolve({status, canAskAgain} as Calendar.PermissionResponse)
}

function generateEvent(): EventType {
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
	}
}

describe('addToCalendar', () => {
	afterEach(() => {
		jest.clearAllMocks()
	})

	it('adds the event to the default calendar when permission is already granted', async () => {
		jest.mocked(Calendar.getCalendarPermissions).mockReturnValue(permissions('granted', true))
		stubDefaultCalendar()
		addEventWithForm.mockResolvedValue({id: 'event-1'})

		let event = generateEvent()
		let result = await addToCalendar(event)

		expect(result).toBe('saved')
		expect(Calendar.requestCalendarPermissions).not.toHaveBeenCalled()
		expect(addEventWithForm).toHaveBeenCalledWith({
			title: event.title,
			startDate: event.startTime.toDate(),
			endDate: event.endTime.toDate(),
			allDay: event.isAllDay,
			location: event.location,
			notes: event.description,
		})
	})

	it('asks for full calendar access, not the write-only variant', async () => {
		jest.mocked(Calendar.getCalendarPermissions).mockReturnValue(permissions('granted', true))
		stubDefaultCalendar()
		addEventWithForm.mockResolvedValue({id: 'event-1'})

		await addToCalendar(generateEvent())

		// Reading the default calendar needs more than write-only access, which
		// iOS 17 split out; `writeOnly` defaults to false, so no argument is the
		// full-access ask.
		expect(Calendar.getCalendarPermissions).toHaveBeenCalledWith()
	})

	it('requests permission and adds the event when access has not been decided yet', async () => {
		jest.mocked(Calendar.getCalendarPermissions).mockReturnValue(permissions('undetermined', true))
		jest.mocked(Calendar.requestCalendarPermissions).mockReturnValue(permissions('granted', true))
		stubDefaultCalendar()
		addEventWithForm.mockResolvedValue({id: 'event-1'})

		let result = await addToCalendar(generateEvent())

		expect(result).toBe('saved')
		expect(Calendar.requestCalendarPermissions).toHaveBeenCalledTimes(1)
		expect(addEventWithForm).toHaveBeenCalledTimes(1)
	})

	it('cancels without prompting when the user denies the permission request', async () => {
		jest.mocked(Calendar.getCalendarPermissions).mockReturnValue(permissions('undetermined', true))
		jest.mocked(Calendar.requestCalendarPermissions).mockReturnValue(permissions('denied', true))

		let result = await addToCalendar(generateEvent())

		expect(result).toBe('cancelled')
		expect(addEventWithForm).not.toHaveBeenCalled()
		expect(alertSpy).not.toHaveBeenCalled()
	})

	it('sends the user to Settings when calendar access is already blocked', async () => {
		jest.mocked(Calendar.getCalendarPermissions).mockReturnValue(permissions('denied', false))

		let result = await addToCalendar(generateEvent())

		expect(result).toBe('cancelled')
		expect(Calendar.requestCalendarPermissions).not.toHaveBeenCalled()
		expect(addEventWithForm).not.toHaveBeenCalled()
		expect(alertSpy).toHaveBeenCalledTimes(1)

		let [, , buttons] = alertSpy.mock.calls[0]
		let settingsButton = buttons?.find((button) => button.text === 'Settings')
		settingsButton?.onPress?.()

		expect(openURLSpy).toHaveBeenCalledWith('app-settings:')
	})

	it('returns error and reports to Sentry when saving the event fails', async () => {
		jest.mocked(Calendar.getCalendarPermissions).mockReturnValue(permissions('granted', true))
		stubDefaultCalendar()
		let error = new Error('boom')
		addEventWithForm.mockRejectedValue(error)

		let result = await addToCalendar(generateEvent())

		expect(result).toBe('error')
		expect(Sentry.captureException).toHaveBeenCalledWith(error)
		expect(consoleErrorSpy).toHaveBeenCalledWith(error)
	})

	it('returns error and reports to Sentry when the device has no default calendar', async () => {
		jest.mocked(Calendar.getCalendarPermissions).mockReturnValue(permissions('granted', true))
		let error = new Error('no default calendar')
		jest.mocked(Calendar.getDefaultCalendarSync).mockImplementation(() => {
			throw error
		})

		let result = await addToCalendar(generateEvent())

		expect(result).toBe('error')
		expect(Sentry.captureException).toHaveBeenCalledWith(error)
		expect(consoleErrorSpy).toHaveBeenCalledWith(error)
	})
})
