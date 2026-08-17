import * as Sentry from '@sentry/react-native'
import * as Calendar from 'expo-calendar'
import {Alert, Linking} from 'react-native'
import type {EventType} from '@frogpond/event-type'

export type AddToCalendarResult = 'saved' | 'cancelled' | 'error'

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
			return 'cancelled'
		}

		// Synchronous, and throws when the device has no default calendar --
		// the surrounding try/catch is what turns that into an 'error' result.
		let defaultCalendar = Calendar.getDefaultCalendarSync()

		await defaultCalendar.createEvent({
			title: event.title,
			startDate: event.startTime.toDate(),
			endDate: event.endTime.toDate(),
			location: event.location,
			notes: event.description,
		})

		return 'saved'
	} catch (error) {
		Sentry.captureException(error)
		console.error(error)
		return 'error'
	}
}
