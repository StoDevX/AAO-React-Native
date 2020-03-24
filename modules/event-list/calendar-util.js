// @flow

import {Share} from 'react-native'

import type {EventType} from '@frogpond/event-type'
import {detailTimes} from './times'

export function shareEvent(event: EventType): Promise<mixed> {
	let title = event.title
	let times = getTimes(event)
	let location = event.location
	let description = event.description

	let message = `${title}\n\n${times}\n\n${location}\n\n${description}`.trim()

	return Share.share({message}).catch(error => console.log(error.message))
}

export function getTimes(event: EventType) {
	let {allDay, start, end} = detailTimes(event)

	if (allDay) {
		return `All-Day on ${event.startTime.format('MMM D.')}`
	}

	return `${start}${end ? ' to ' + end : ''}`
}
