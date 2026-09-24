import * as Sentry from '@sentry/react-native'
import {createEventInCalendarAsync} from 'expo-calendar/legacy'
import type {EventType} from '@frogpond/event-type'

export type AddToCalendarResult = 'saved' | 'cancelled' | 'error'

/**
 * Opens the system's new-event editor, filled in from `event`. From iOS 17
 * the editor runs outside the app and needs no calendar access, so nothing
 * here asks for any -- and the app ships no calendar usage string, so a call
 * that did touch calendar data would end the app rather than prompt.
 *
 * The legacy entry point is the only one in expo-calendar that skips its
 * permission check: the object API needs a calendar to add to, and reading
 * one needs full access.
 */
export async function addToCalendar(event: EventType): Promise<AddToCalendarResult> {
	try {
		let result = await createEventInCalendarAsync({
			title: event.title,
			startDate: event.startTime.toDate(),
			endDate: event.endTime.toDate(),
			allDay: event.isAllDay,
			location: event.location,
			notes: event.description,
		})
		return result.action === 'saved' ? 'saved' : 'cancelled'
	} catch (error) {
		Sentry.captureException(error)
		console.error(error)
		return 'error'
	}
}
