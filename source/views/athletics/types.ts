import {Constants} from './constants'

export interface LocationInfo {
	location: string
	HAN: 'H' | 'A' | 'N'
	facility: string
}

export interface StatusInfo {
	indicator: 'O' | 'A'
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

export type GameResult = 'W' | 'L' | 'N' | ''

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

export interface AthleticsResponse {
	timestamp: unknown
	status: unknown
	scores: Score[]
}

export type AthleticsData = Score[]

export interface GroupedScores {
	title: string
	data: Score[]
}

export type DateSection =
	| typeof Constants.YESTERDAY
	| typeof Constants.TODAY
	| typeof Constants.UPCOMING
	| typeof Constants.FILTER

export type ProcessedScore = Score & {parsedDate: Date}

export interface DateGroupedScores {
	title: DateSection
	data: ProcessedScore[]
}
