import {describe, expect, it, jest} from '@jest/globals'
import {Alert, Linking} from 'react-native'
import * as Sentry from '@sentry/react-native'
import * as Calendar from 'expo-calendar'
import moment from 'moment'
import type {EventType} from '@frogpond/event-type'
import {addToCalendar} from '../lib'

jest.mock('@sentry/react-native', () => ({captureException: jest.fn()}))
jest.mock('expo-calendar', () => ({
	getCalendarPermissionsAsync: jest.fn(),
	requestCalendarPermissionsAsync: jest.fn(),
	getDefaultCalendarAsync: jest.fn(),
	createEventAsync: jest.fn(),
}))

let alertSpy = jest.spyOn(Alert, 'alert').mockReturnValue(undefined)
let openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true)

function generateEvent(): EventType {
	return {
		title: 'Founders Day',
		description: 'A celebration',
		location: 'Buntrock',
		startTime: moment('2026-09-01T17:00:00Z'),
		endTime: moment('2026-09-01T19:00:00Z'),
		isOngoing: false,
		links: [],
		config: {startTime: false, endTime: false, subtitle: 'description'},
	}
}

describe('addToCalendar', () => {
	afterEach(() => {
		jest.clearAllMocks()
	})

	it('adds the event to the default calendar when permission is already granted', async () => {
		jest
			.mocked(Calendar.getCalendarPermissionsAsync)
			.mockResolvedValue({status: 'granted', canAskAgain: true} as never)
		jest.mocked(Calendar.getDefaultCalendarAsync).mockResolvedValue({id: 'cal-1'} as never)
		jest.mocked(Calendar.createEventAsync).mockResolvedValue('event-1' as never)

		let event = generateEvent()
		let result = await addToCalendar(event)

		expect(result).toBe('saved')
		expect(Calendar.requestCalendarPermissionsAsync).not.toHaveBeenCalled()
		expect(Calendar.createEventAsync).toHaveBeenCalledWith('cal-1', {
			title: event.title,
			startDate: event.startTime.toDate(),
			endDate: event.endTime.toDate(),
			location: event.location,
			notes: event.description,
		})
	})

	it('requests permission and adds the event when access has not been decided yet', async () => {
		jest
			.mocked(Calendar.getCalendarPermissionsAsync)
			.mockResolvedValue({status: 'undetermined', canAskAgain: true} as never)
		jest
			.mocked(Calendar.requestCalendarPermissionsAsync)
			.mockResolvedValue({status: 'granted'} as never)
		jest.mocked(Calendar.getDefaultCalendarAsync).mockResolvedValue({id: 'cal-1'} as never)
		jest.mocked(Calendar.createEventAsync).mockResolvedValue('event-1' as never)

		let result = await addToCalendar(generateEvent())

		expect(result).toBe('saved')
		expect(Calendar.requestCalendarPermissionsAsync).toHaveBeenCalledTimes(1)
		expect(Calendar.createEventAsync).toHaveBeenCalledTimes(1)
	})

	it('cancels without prompting when the user denies the permission request', async () => {
		jest
			.mocked(Calendar.getCalendarPermissionsAsync)
			.mockResolvedValue({status: 'undetermined', canAskAgain: true} as never)
		jest
			.mocked(Calendar.requestCalendarPermissionsAsync)
			.mockResolvedValue({status: 'denied'} as never)

		let result = await addToCalendar(generateEvent())

		expect(result).toBe('cancelled')
		expect(Calendar.createEventAsync).not.toHaveBeenCalled()
		expect(alertSpy).not.toHaveBeenCalled()
	})

	it('sends the user to Settings when calendar access is already blocked', async () => {
		jest
			.mocked(Calendar.getCalendarPermissionsAsync)
			.mockResolvedValue({status: 'denied', canAskAgain: false} as never)

		let result = await addToCalendar(generateEvent())

		expect(result).toBe('cancelled')
		expect(Calendar.requestCalendarPermissionsAsync).not.toHaveBeenCalled()
		expect(Calendar.createEventAsync).not.toHaveBeenCalled()
		expect(alertSpy).toHaveBeenCalledTimes(1)

		let [, , buttons] = alertSpy.mock.calls[0]
		let settingsButton = buttons?.find((button) => button.text === 'Settings')
		settingsButton?.onPress?.()

		expect(openURLSpy).toHaveBeenCalledWith('app-settings:')
	})

	it('returns error and reports to Sentry when saving the event fails', async () => {
		jest
			.mocked(Calendar.getCalendarPermissionsAsync)
			.mockResolvedValue({status: 'granted', canAskAgain: true} as never)
		jest.mocked(Calendar.getDefaultCalendarAsync).mockResolvedValue({id: 'cal-1'} as never)
		let error = new Error('boom')
		jest.mocked(Calendar.createEventAsync).mockRejectedValue(error)

		let result = await addToCalendar(generateEvent())

		expect(result).toBe('error')
		expect(Sentry.captureException).toHaveBeenCalledWith(error)
	})
})
