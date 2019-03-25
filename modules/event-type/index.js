// @flow
import type moment from 'moment'

export type EventType = {
	title: string,
	description: string,
	location: string,
	startTime: moment,
	endTime: moment,
	isOngoing: boolean,
	links: Array<string>,
	config: {
		startTime: boolean,
		endTime: boolean,
		subtitle: 'location' | 'description',
	},
}
