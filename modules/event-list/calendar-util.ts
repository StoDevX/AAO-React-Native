import {Share, ShareAction} from 'react-native'

import type {EventType} from '@frogpond/event-type'
import {format} from '../../source/lib/temporal'
import {detailTimes} from './times'

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
		return `All-Day on ${format(event.startTime, 'MMM D.')}`
	}

	return `${start}${end ? ' to ' + end : ''}`
}
