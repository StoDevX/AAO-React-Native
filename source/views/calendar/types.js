// @flow
import type moment from 'moment'

type GoogleTimeType = {
	dateTime: string,
}
export type GoogleEventType = {
	summary?: string,
	description?: string,
	start: GoogleTimeType,
	end: GoogleTimeType,
	location?: string,
}


export type PoweredBy = {
	title: string,
	href: string,
}

export type EventType = {|
	title: string,
	description: string,
	location: string,
	startTime: moment,
	endTime: moment,
	isOngoing: boolean,
	config: {
		startTime: boolean,
		endTime: boolean,
		subtitle: 'location' | 'description',
	},
|}
