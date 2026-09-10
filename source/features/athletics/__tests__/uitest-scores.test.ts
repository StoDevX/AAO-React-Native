import {UITEST_FROZEN_DATE} from '@frogpond/timer'
import {UITEST_SCORES} from '../__fixtures__/scores'
import {Constants} from '../constants'
import {groupScoresByDate, sectionsForTab, toProcessedScores} from '../utils'

/// The fixtures exist so no tab is empty for want of a real game. That is only
/// true if they land in the buckets they were written for, which depends on the
/// frozen clock -- so this asserts the pairing rather than trusting it.
const grouped = groupScoresByDate(toProcessedScores(UITEST_SCORES), new Date(UITEST_FROZEN_DATE))

describe('the UI test scores', () => {
	it('survive parsing, every one of them', () => {
		expect(toProcessedScores(UITEST_SCORES)).toHaveLength(UITEST_SCORES.length)
	})

	it('fill the Yesterday tab', () => {
		expect(sectionsForTab(Constants.YESTERDAY, grouped)).not.toHaveLength(0)
	})

	it("fill all three of Today's sections", () => {
		let titles = sectionsForTab(Constants.TODAY, grouped).map((s) => s.title)

		expect(titles).toEqual([Constants.ONGOING, Constants.FINALIZED, Constants.UPCOMING])
	})

	it('fill the Upcoming tab', () => {
		expect(sectionsForTab(Constants.UPCOMING, grouped)).not.toHaveLength(0)
	})
})
