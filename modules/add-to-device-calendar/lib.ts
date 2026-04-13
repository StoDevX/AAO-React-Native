import * as Sentry from '@sentry/react-native'
import type {EventType} from '@frogpond/event-type'
import * as Calendar from 'expo-calendar'
import {Alert, Linking, Platform} from 'react-native'

export async function addToCalendar(event: EventType): Promise<boolean> {
	try {
		const {status, canAskAgain} = await Calendar.getCalendarPermissionsAsync()

		if (status === Calendar.PermissionStatus.GRANTED) {
			return await saveEventToCalendar(event)
		}

		if (!canAskAgain) {
			promptSettings()
			return false
		}

		const granted = await requestCalendarAccess()
		if (!granted) {
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
		const calendars = await Calendar.getCalendarsAsync(
			Calendar.EntityTypes.EVENT,
		)
		if (calendars.length === 0) {
			Alert.alert(
				'No Calendar Found',
				'Please add a calendar account to your device in Settings before adding events.',
			)
			return false
		}
		const defaultCalendar = await Calendar.getDefaultCalendarAsync()
		await Calendar.createEventAsync(defaultCalendar.id, {
			title: event.title,
			location: event.location || undefined,
			startDate: event.startTime.toDate(),
			endDate: event.endTime.toDate(),
			notes: event.description || undefined,
		})
		return true
	} catch (err) {
		Sentry.captureException(err)
		console.error(err)
		return false
	}
}

function promptSettings(): void {
	if (Platform.OS === 'ios') {
		// Note: remember to change this text in the iOS plist, too.
		Alert.alert(
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
	try {
		const {status} = await Calendar.requestCalendarPermissionsAsync()
		if (status !== Calendar.PermissionStatus.GRANTED) {
			promptSettings()
			return false
		}
		return true
	} catch {
		return false
	}
}
