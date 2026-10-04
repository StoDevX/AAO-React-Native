import {gameSummary} from '../utils'
import type {ProcessedScore} from '../types'

function makeScore(props: Partial<ProcessedScore>): ProcessedScore {
	return {
		id: '1',
		sport: "Women's Soccer",
		sport_abbrev: 'WSOC',
		date: '',
		dateFormatted: '',
		date_utc: '',
		date_end_utc: '',
		time: '7:00 PM',
		timestamp: 0,
		location: {} as ProcessedScore['location'],
		status: {indicator: 'scheduled'} as ProcessedScore['status'],
		hometeam: 'St. Olaf ',
		hometeam_logo: '',
		opponent: ' Carleton',
		opponent_logo: '',
		team_score: '',
		opponent_score: '',
		result: '' as ProcessedScore['result'],
		ip_time: '',
		prescore_info: '',
		postscore_info: '',
		links: {} as ProcessedScore['links'],
		coverage: {} as ProcessedScore['coverage'],
		parsedDate: new Date('2026-09-11T19:00:00Z'),
		...props,
	}
}

describe('gameSummary', () => {
	it('shows the kickoff time for a game that has not started', () => {
		let summary = gameSummary(makeScore({}))

		expect(summary.showsTime).toBe(true)
		expect(summary.label).toBe('7:00 PM')
	})

	/// All-day and multi-day fixtures carry no time string at all.
	it('says All day for a fixture with no time', () => {
		let summary = gameSummary(makeScore({time: ''}))

		expect(summary.label).toBe('All day')
	})

	it('shows the score once a game has a result', () => {
		let summary = gameSummary(
			makeScore({
				status: {indicator: 'final'} as ProcessedScore['status'],
				result: 'W' as ProcessedScore['result'],
				team_score: '3',
				opponent_score: '1',
			}),
		)

		expect(summary.showsTime).toBe(false)
		expect(summary.label).toBe('W 3-1')
	})

	/// An in-progress game has a score but no result letter yet.
	it('shows the score with no result letter while a game is ongoing', () => {
		let summary = gameSummary(
			makeScore({
				status: {indicator: 'live'} as ProcessedScore['status'],
				team_score: '1',
				opponent_score: '0',
			}),
		)

		expect(summary.showsTime).toBe(false)
		expect(summary.label).toBe('1-0')
	})

	/// Past kickoff with nothing reporting a score, ccc-server sends the score
	/// blank, so the row keeps the kickoff time rather than reading "-".
	it('keeps the kickoff time once a game has started without a score', () => {
		let summary = gameSummary(
			makeScore({status: {indicator: 'started'} as ProcessedScore['status']}),
		)

		expect(summary.showsTime).toBe(true)
		expect(summary.label).toBe('7:00 PM')
	})

	/// livestats has the game over, but the official result is not posted yet.
	it('shows the score with no result letter for an unofficial final', () => {
		let summary = gameSummary(
			makeScore({
				status: {indicator: 'unofficial-final'} as ProcessedScore['status'],
				team_score: '2',
				opponent_score: '2',
			}),
		)

		expect(summary.showsTime).toBe(false)
		expect(summary.label).toBe('2-2')
	})

	it('reads out the sport, both teams and the state of play', () => {
		let summary = gameSummary(makeScore({}))

		expect(summary.accessibilityLabel).toBe("Women's Soccer: St. Olaf vs Carleton, 7:00 PM")
	})
})
