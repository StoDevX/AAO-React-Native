export interface RawStreamType {
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
}

export interface StreamType extends RawStreamType {
	renderedDate: string
	$groupBy?: string
}
