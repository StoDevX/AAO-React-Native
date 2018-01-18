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

type EmbeddedEventDetailType = {type: 'google', data: GoogleEventType}

export type PoweredBy = {
	title: string,
	href: string,
}

export type EventType = {
	summary: string,
	location: string,
	startTime: moment,
	endTime: moment,
	isOngoing: boolean,
	extra: EmbeddedEventDetailType,
}

export type CleanedEventType = {
	title: string,
	summary: string,
	location: string,
	startTime: moment,
	endTime: moment,
	isOngoing: boolean,
	extra: EmbeddedEventDetailType,
}
