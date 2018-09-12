// @flow

import type {EventType} from '@frogpond/event-type'
import {notify} from '@frogpond/analytics'
import RNCalendarEvents from 'react-native-calendar-events'
import {Alert, Linking, Platform} from 'react-native'

export function addToCalendar(event: EventType): Promise<boolean> {
	return RNCalendarEvents.authorizationStatus()
		.then(authStatus => {
			if (authStatus !== 'authorized') {
				return requestCalendarAccess()
			}
			return true
		})
		.then(status => {
			if (!status) {
				return false
			}
			return saveEventToCalendar(event)
		})
		.catch(err => {
			notify(err)
			console.error(err)
			return false
		})
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
		notify(err)
		console.error(err)
		return false
	}
}

function promptSettings(): any {
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
		status = await RNCalendarEvents.authorizeEventStore()
	} catch (err) {
		return false
	}

	if (status !== 'authorized') {
		return promptSettings()
	}

	return true
}
