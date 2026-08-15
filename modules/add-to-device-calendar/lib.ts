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

async function requestCalendarAccess(): Promise<boolean> {
	let {status, canAskAgain} = await Calendar.getCalendarPermissionsAsync()

	if (status === 'granted') {
		return true
	}

	if (!canAskAgain) {
		promptSettings()
		return false
	}

	let requested = await Calendar.requestCalendarPermissionsAsync()
	return requested.status === 'granted'
}

export async function addToCalendar(event: EventType): Promise<AddToCalendarResult> {
	try {
		let granted = await requestCalendarAccess()
		if (!granted) {
			return 'cancelled'
		}

		let defaultCalendar = await Calendar.getDefaultCalendarAsync()

		await Calendar.createEventAsync(defaultCalendar.id, {
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
