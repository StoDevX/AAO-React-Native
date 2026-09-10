import type {Score} from '../types'

/**
 * Scores for UI testing, anchored to `UITEST_FROZEN_DATE` -- the Saturday the
 * app's clock is frozen to under `--uitesting`. Between them they fill every
 * bucket the tabs can show: yesterday, today's ongoing/finalized/upcoming, and
 * a later fixture, so no tab is empty for want of a real game that day.
 *
 * Live scores are whatever St. Olaf played this week, which is nothing to
 * assert against -- see `source/features/dictionary/query.ts` for the same
 * reasoning about entries.
 */

/// A 1x1 grey PNG, stretched to fill the crest's frame.
///
/// Visible on purpose: a crest that drew nothing would look exactly like one
/// that failed to load, so a plain square is what shows the row really did host
/// the image. Inline rather than a URL so it cannot fail for want of a network.
const LOGO =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGM4fvwMAASzAlv//YG7AAAAAElFTkSuQmCC'

function score(props: Partial<Score> & Pick<Score, 'id' | 'sport' | 'date_utc'>): Score {
	return {
		sport_abbrev: '',
		date: '',
		dateFormatted: '',
		date_end_utc: '',
		time: '',
		timestamp: 0,
		location: {location: 'Northfield, Minn.', facility: 'Manitou Field', homeAway: 'H'},
		status: {indicator: 'A', value: ''},
		hometeam: 'St. Olaf',
		hometeam_logo: LOGO,
		opponent: 'Carleton',
		opponent_logo: LOGO,
		team_score: '',
		opponent_score: '',
		result: '',
		ip_time: '',
		prescore_info: '',
		postscore_info: '',
		links: {},
		coverage: {},
		...props,
	}
}

export const UITEST_SCORES: Score[] = [
	score({
		id: 'uitest-yesterday',
		sport: "Women's Soccer",
		date_utc: '2026-09-04T19:00:00-05:00',
		time: '7:00 PM',
		result: 'L',
		team_score: '1',
		opponent_score: '2',
	}),
	score({
		id: 'uitest-today-ongoing',
		sport: "Men's Soccer",
		date_utc: '2026-09-05T14:00:00-05:00',
		time: '2:00 PM',
		status: {indicator: 'O', value: 'In Progress'},
		team_score: '2',
		opponent_score: '0',
	}),
	score({
		id: 'uitest-today-finalized',
		sport: 'Volleyball',
		date_utc: '2026-09-05T11:00:00-05:00',
		time: '11:00 AM',
		result: 'W',
		team_score: '3',
		opponent_score: '1',
		opponent: 'Gustavus Adolphus',
	}),
	score({
		id: 'uitest-today-upcoming',
		sport: 'Football',
		date_utc: '2026-09-05T19:00:00-05:00',
		time: '7:00 PM',
		opponent: 'Bethel',
	}),
	/// No `time` at all, which is how the feed sends an all-day fixture -- the
	/// row reads "All day" for it rather than an empty gap.
	score({
		id: 'uitest-upcoming-allday',
		sport: "Women's Golf",
		date_utc: '2026-09-07T00:00:00-05:00',
		opponent: 'Invitational',
	}),
	score({
		id: 'uitest-upcoming',
		sport: 'Cross Country',
		date_utc: '2026-09-12T10:00:00-05:00',
		time: '10:00 AM',
		opponent: 'St. Thomas',
	}),
]
