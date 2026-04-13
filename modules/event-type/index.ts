import {Temporal} from 'temporal-polyfill'

export type EventType = {
	readonly title: string
	readonly description: string
	readonly location: string
	readonly startTime: Temporal.ZonedDateTime
	readonly endTime: Temporal.ZonedDateTime
	readonly isOngoing: boolean
	readonly links: Array<string>
	readonly config: {
		readonly startTime: boolean
		readonly endTime: boolean
		readonly subtitle: 'location' | 'description'
	}
}
