import * as Sentry from '@sentry/react-native'
import type {EventType} from '@frogpond/event-type'
import * as Calendar from 'expo-calendar'
import {Alert, Linking, Platform} from 'react-native'

export async function addToCalendar(event: EventType): Promise<boolean> {
	try {
		const {status: currentStatus} = await Calendar.getCalendarPermissionsAsync()

		const authStatus =
			currentStatus === 'granted' ? true : await requestCalendarAccess()

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
		const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT)
		const defaultCalendar = calendars.find(cal => cal.allowsModifications) || calendars[0]

		if (!defaultCalendar) {
			console.error('No calendar available')
			return false
		}

		await Calendar.createEventAsync(defaultCalendar.id, {
			title: event.title,
			location: event.location,
			startDate: event.startTime.toDate(),
			endDate: event.endTime.toDate(),
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
	try {
		const {status} = await Calendar.requestCalendarPermissionsAsync()

		if (status !== 'granted') {
			return promptSettings() === undefined
		}

		return true
	} catch (_err) {
		return false
	}
}
