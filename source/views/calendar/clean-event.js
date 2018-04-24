// @flow
import type {EventType} from './types'
import {fastGetTrimmedText} from '../../lib/html'

export function cleanEvent(event: EventType) {
	const title = fastGetTrimmedText(event.title)
	const description = cleanDescription(event.description)
	const location = fastGetTrimmedText(event.location)

	return {
		...event,
		title,
		description,
		location,
	}
}

function cleanDescription(desc: string) {
	const description = fastGetTrimmedText(desc || '')

	if (description === 'See more details') {
		return ''
	}

	return description
}
