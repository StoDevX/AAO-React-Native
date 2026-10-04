import {athleticsOptions} from '../query'
import type {Score, StatusInfo} from '../types'

// React Query hands the interval function the whole Query; it only reads the
// raw scores in `state.data`.
const refetchInterval = athleticsOptions.refetchInterval as (query: {
	state: {data?: Score[]}
}) => number

const HOUR = 60 * 60 * 1000

/// Kicked off `hoursAgo` hours before the real clock: the interval reads `new Date()`.
const makeScore = (indicator: StatusInfo['indicator'], hoursAgo = 1): Score =>
	({
		id: '1',
		date_utc: new Date(Date.now() - hoursAgo * HOUR).toISOString(),
		status: {indicator, value: ''},
	}) as Score

const THIRTY_SECONDS = 30 * 1000
const FIVE_MINUTES = 5 * 60 * 1000

describe('athleticsOptions.refetchInterval', () => {
	test.each(['started', 'live', 'unofficial-final'] as const)(
		'polls every thirty seconds while a game is %s',
		(indicator) => {
			const data = [makeScore('final'), makeScore(indicator)]
			expect(refetchInterval({state: {data}})).toBe(THIRTY_SECONDS)
		},
	)

	test('polls every five minutes when no game is in play', () => {
		const data = [makeScore('scheduled'), makeScore('final')]
		expect(refetchInterval({state: {data}})).toBe(FIVE_MINUTES)
	})

	test('polls every five minutes for a game left in play over a day after kickoff', () => {
		const data = [makeScore('started', 25)]
		expect(refetchInterval({state: {data}})).toBe(FIVE_MINUTES)
	})

	test('polls every five minutes before any scores have loaded', () => {
		expect(refetchInterval({state: {}})).toBe(FIVE_MINUTES)
	})
})
