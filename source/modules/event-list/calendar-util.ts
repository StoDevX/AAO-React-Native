import {Share, ShareAction} from 'react-native'
import type {EventType} from '../event-type'
import {detailTimes} from './times'
import {captureException} from '@sentry/react-native'

export function shareEvent(event: EventType): Promise<ShareAction | null> {
	let title = event.title
	let times = getTimes(event)
	let location = event.location
	let description = event.description

	let message = `${title}\n\n${times}\n\n${location}\n\n${description}`.trim()

	return Share.share({message}).catch((error: unknown) => {
		captureException(error)
		return null
	})
}

export function getTimes(event: EventType): string {
	let {allDay, start, end} = detailTimes(event)

	if (allDay) {
		return `All-Day on ${event.startTime.format('MMM D.')}`
	}

	return `${start}${end ? ' to ' + end : ''}`
}
