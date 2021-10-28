import type {Moment} from 'moment'

export type EventType = {
	title: string
	description: string
	location: string
	startTime: Moment
	endTime: Moment
	isOngoing: boolean
	links: Array<string>
	config: {
		startTime: boolean
		endTime: boolean
		subtitle: 'location' | 'description'
	}
}
