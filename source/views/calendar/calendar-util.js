// @flow

import {Platform, Alert, Linking, Share} from 'react-native'
import RNCalendarEvents from 'react-native-calendar-events'
import getUrls from 'get-urls'
import type {EventType} from './types'
import bugsnag from '../../bugsnag'
import {tracker} from '../../analytics'
import {detailTimes} from './times'

export function shareEvent(event: EventType): Promise<any> {
	const title = event.title
	const times = getTimes(event)
	const location = event.location
	const message = `${title}\n\n${times}\n\n${location}`
	return Share.share({message})
		.then(result => console.log(result))
		.catch(error => console.log(error.message))
}

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
			tracker.trackException(err.message)
			bugsnag.notify(err)
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
		})
		return true
	} catch (err) {
		tracker.trackException(err.message)
		bugsnag.notify(err)
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

export function getLinksFromEvent(event: EventType) {
	// Clean up returns, newlines, tabs, and misc symbols...
	// ...and search for links in the text
	return Array.from(getUrls(event.description))
}

export function getTimes(event: EventType) {
	const {allDay, start, end} = detailTimes(event)

	if (allDay) {
		return `All-Day on ${event.startTime.format('MMM D.')}`
	}

	return `${start}${end ? ' to ' + end : ''}`
}
