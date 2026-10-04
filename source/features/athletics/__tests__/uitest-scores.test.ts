import {UITEST_FROZEN_DATE} from '@frogpond/timer'
import {UITEST_SCORES} from '../__fixtures__/scores'
import {Constants} from '../constants'
import {daySections, toProcessedScores} from '../utils'

/// The fixtures exist so the list has a day either side of Today to scroll
/// to. That is only true if they land on the days they were written for, which
/// depends on the frozen clock -- so this asserts the pairing rather than
/// trusting it.
const sections = daySections(toProcessedScores(UITEST_SCORES), new Date(UITEST_FROZEN_DATE))

describe('the UI test scores', () => {
	it('survive parsing, every one of them', () => {
		expect(toProcessedScores(UITEST_SCORES)).toHaveLength(UITEST_SCORES.length)
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
