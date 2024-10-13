import type {Moment} from 'moment'

export interface EventType {
	readonly title: string
	readonly description: string
	readonly location: string
	readonly startTime: Moment
	readonly endTime: Moment
	readonly isOngoing: boolean
	readonly links: string[]
	readonly config: {
		readonly startTime: boolean
		readonly endTime: boolean
		readonly subtitle: 'location' | 'description'
	}
}
