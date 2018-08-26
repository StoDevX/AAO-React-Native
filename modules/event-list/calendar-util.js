// @flow

import {Share} from 'react-native'
import getUrls from 'get-urls'
import type {EventType} from './types'
import {detailTimes} from './times'

export function shareEvent(event: EventType): Promise<mixed> {
	const title = event.title
	const times = getTimes(event)
	const location = event.location
	const description = event.description

	const message = `${title}\n\n${times}\n\n${location}\n\n${description}`.trim()

	return Share.share({message}).catch(error => console.log(error.message))
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
