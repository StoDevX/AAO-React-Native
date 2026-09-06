import * as Sentry from '@sentry/react-native'
import * as Calendar from 'expo-calendar'
import {Alert, Linking} from 'react-native'
import type {EventType} from '@frogpond/event-type'

export type AddToCalendarResult =
	| {status: 'saved'; eventId: string}
	| {status: 'cancelled'}
	| {status: 'error'}

function promptSettings(): void {
	// Note: remember to change this text in the iOS plist, too.
	Alert.alert(
		'"All About Olaf" Would Like to Access Your Calendar',
		'We use your calendar to add events to your calendar so that you remember what you wanted to attend.',
		[
			{text: "Don't Allow", style: 'cancel'},
			{text: 'Settings', onPress: () => Linking.openURL('app-settings:')},
		],
	)
}

/**
 * Asks for full calendar access rather than the write-only access iOS 17 split
 * out: `getDefaultCalendarSync` reads the device's calendars, which write-only
 * access does not cover. `writeOnly` defaults to false, so no argument is the
 * full-access ask.
 */
async function requestCalendarAccess(): Promise<boolean> {
	let {status, canAskAgain} = await Calendar.getCalendarPermissions()

	if (status === 'granted') {
		return true
	}

	if (!canAskAgain) {
		promptSettings()
		return false
	}

	let requested = await Calendar.requestCalendarPermissions()
	return requested.status === 'granted'
}

export async function addToCalendar(event: EventType): Promise<AddToCalendarResult> {
	try {
		let granted = await requestCalendarAccess()
		if (!granted) {
			return {status: 'cancelled'}
		}

		let defaultCalendar = Calendar.getDefaultCalendarSync()

		let result = await defaultCalendar.addEventWithForm({
			title: event.title,
			startDate: event.startTime.toDate(),
			endDate: event.endTime.toDate(),
			allDay: event.isAllDay,
			location: event.location,
			notes: event.description,
		})

		if (result.action === 'canceled' || !result.id) {
			return {status: 'cancelled'}
		}
		return {status: 'saved', eventId: result.id}
	} catch (error) {
		Sentry.captureException(error)
		console.error(error)
		return {status: 'error'}
	}
}

export async function openCalendarEvent(eventId: string): Promise<void> {
	let event = await Calendar.ExpoCalendarEvent.get(eventId)
	await event.openInCalendar()
}
