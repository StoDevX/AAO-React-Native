export interface LocationInfo {
	location: string
	homeAway?: 'H' | 'A' | 'N'
	facility: string
}

/**
 * Where a game stands, as ccc-server decides it from the scores feed, the
 * livestats feed and the clock.
 *
 * - `scheduled`: not yet kicked off
 * - `started`: past kickoff, but nothing reports a score yet
 * - `live`: livestats reports the game under way, with a score
 * - `unofficial-final`: livestats reports the game over; no official result yet
 * - `final`: the scores feed has posted a result
 */
export type GameState = 'scheduled' | 'started' | 'live' | 'unofficial-final' | 'final'

export interface StatusInfo {
	indicator: GameState
	value: string
}

export interface Link {
	url: string
	text: string
}

export interface Coverage {
	[key: string]: unknown
}

export interface Links {
	postgame?: Link
	boxscore?: Link
	livestats?: Link
	streaming_video?: Link
}

export type GameResult = 'W' | 'L' | 'T' | 'N' | ''

export interface Score {
	id: string
	sport: string
	sport_abbrev: string
	date: string
	dateFormatted: string
	date_utc: string
	date_end_utc: string
	time: string
	timestamp: number
	location: LocationInfo
	status: StatusInfo
	hometeam: string
	hometeam_logo: string
	opponent: string
	opponent_logo: string
	team_score: string
	opponent_score: string
	result: GameResult
	ip_time: string
	prescore_info: string
	postscore_info: string
	links: Links
	coverage: Coverage
}

export type ProcessedScore = Score & {parsedDate: Date}

/** One day of games in the athletics list. */
export interface DaySection {
	/** Stable across renders and refetches: the day itself, as `YYYY-MM-DD`. */
	key: string
	/** "Yesterday", "Today", "Tomorrow", or the weekday and date. */
	title: string
	isToday: boolean
	data: ProcessedScore[]
}

/** A gender-based grouping of sport names, used to render the filter screen. */
export interface SportSection {
	title: string
	data: string[]
}
