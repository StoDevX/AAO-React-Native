import type {Moment} from 'moment-timezone'

export type StreamType = {
	category: string
	eid: string
	iframesrc: string
	lastmod: string
	location?: string
	performer?: string
	player: string
	poster: string
	starttime: string
	status: string
	subtitle?: string
	thumb: string
	title: string
	date: Moment
	$groupBy?: string
}
