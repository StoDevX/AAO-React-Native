import * as Sentry from '@sentry/react-native'
import type {EventType} from '@frogpond/event-type'
import RNCalendarEvents from 'react-native-calendar-events'
import {Alert, Linking, Platform} from 'react-native'

export async function addToCalendar(event: EventType): Promise<boolean> {
	try {
		const authCode = await RNCalendarEvents.checkPermissions(false)

		const authStatus =
			authCode === 'authorized' ? true : await requestCalendarAccess()

		if (!authStatus) {
			return false
		}

		return await saveEventToCalendar(event)
	} catch (error) {
		Sentry.captureException(error)
		console.error(error)
		return false
	}
}

async function saveEventToCalendar(event: EventType): Promise<boolean> {
	try {
		await RNCalendarEvents.saveEvent(event.title, {
			location: event.location,
			startDate: event.startTime.toISOString(),
			endDate: event.endTime.toISOString(),
			description: event.description,
			notes: event.description,
		})

		return true
	} catch (err) {
		Sentry.captureException(err)
		console.error(err)
		return false
	}
}

function promptSettings(): Alert | void {
	if (Platform.OS === 'ios') {
		// Note: remember to change this text in the iOS plist, too.
		return Alert.alert(
			'"All About Olaf" Would Like to Access Your Calendar',
			`We use your calendar to add events to your calendar so that you remember
       what you wanted to attend.`,
			[
				{
					text: "Don't Allow",
					onPress: () => console.log('cancel pressed'),
					style: 'cancel',
				},
				{text: 'Settings', onPress: () => Linking.openURL('app-settings:')},
			],
		)
	}
}

async function requestCalendarAccess(): Promise<boolean> {
	let status = null
	try {
		status = await RNCalendarEvents.requestPermissions(false)
	} catch (err) {
		return false
	}

	if (status !== 'authorized') {
		return promptSettings() === undefined
	}

	return true
}
