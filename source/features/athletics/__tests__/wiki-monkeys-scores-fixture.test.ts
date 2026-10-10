import {UITEST_FROZEN_DATE} from '@frogpond/timer'
import type {CampusRecordingFile} from '../../campus/fixtures'
import exampleCollege from '../../campus/__fixtures__/example.college'
import {Constants} from '../constants'
import type {Score} from '../types'
import {daySections, toProcessedScores} from '../utils'

const recording = (exampleCollege as ReadonlyArray<CampusRecordingFile>).find(
	(file) => file.key === 'GET {server:example.college}/athletics/scores',
)
const SCORES = recording?.json as Score[]

/// Wiki Monkeys' week of games gives the list a day either side of Today to scroll to, in
/// every state. That is only true if they land on the days they were written for, which
/// depends on the UI tests' frozen clock -- so this asserts the pairing rather than
/// trusting it.
const sections = daySections(toProcessedScores(SCORES), new Date(UITEST_FROZEN_DATE))

describe("Wiki Monkeys' scores fixture", () => {
	it('survive parsing, every one of them', () => {
		expect(toProcessedScores(SCORES)).toHaveLength(SCORES.length)
	})

	/// Jest runs on Central time; the UI test simulators run on UTC. A kickoff
	/// whose date differs between the two lands in a different section there.
	it('fall on the day they are written for in UTC as well as Central', () => {
		for (let score of SCORES) {
			let writtenDay = score.date_utc.slice(0, 10)
			expect([score.id, new Date(score.date_utc).toISOString().slice(0, 10)]).toEqual([
				score.id,
				writtenDay,
			])
		}
	})

	it('put games on Yesterday, Today, and days after', () => {
		let titles = sections.map((s) => s.title)
		let todayIndex = titles.indexOf(Constants.TODAY)

		expect(titles[todayIndex - 1]).toBe(Constants.YESTERDAY)
		expect(sections.slice(todayIndex + 1)).not.toHaveLength(0)
	})

	it('put a game in every state on Today', () => {
		let today = sections.find((s) => s.isToday)?.data ?? []

		expect(new Set(today.map((score) => score.status.indicator))).toEqual(
			new Set(['live', 'final', 'scheduled']),
		)
	})
})
