import {Share, ShareAction} from 'react-native'

import type {EventType} from '@frogpond/event-type'
import {detailTimes} from './times'

/// EventType has no id field, so this stands in for one when selecting a
/// single event out of a fetched list. Two events with the exact same
/// start time and title would collide -- `.find()` just returns the
/// first match, which is indistinguishable from correct behavior to the
/// user, so this isn't guarded against further.
export function eventKey(event: EventType): string {
	return `${event.startTime.toISOString()}|${event.title}`
}

export function shareEvent(event: EventType): Promise<ShareAction | void> {
	let title = event.title
	let times = getTimes(event)
	let location = event.location
	let description = event.description

	let message = `${title}\n\n${times}\n\n${location}\n\n${description}`.trim()

	return Share.share({message}).catch((error) => console.log(String(error)))
}

export function getTimes(event: EventType): string {
	let {allDay, start, end} = detailTimes(event)

	if (allDay) {
		return `All-Day on ${event.startTime.format('MMM D.')}`
	}

	return `${start}${end ? ' to ' + end : ''}`
}
