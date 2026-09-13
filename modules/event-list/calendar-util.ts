import {Share, ShareAction} from 'react-native'

import type {EventType} from '@frogpond/event-type'
import {detailTimes} from './times'

// This file imports react-native for Share, so the key format has to live
// somewhere a test that cannot load react-native can still reach it.
export {dedupeKey, eventKey} from './keys'

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
