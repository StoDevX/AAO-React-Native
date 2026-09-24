import {athleticsOptions} from '../query'
import type {Score, StatusInfo} from '../types'

// React Query hands the interval function the whole Query; it only reads the
// raw scores in `state.data`.
const refetchInterval = athleticsOptions.refetchInterval as (query: {
	state: {data?: Score[]}
}) => number

const makeScore = (indicator: StatusInfo['indicator']): Score =>
	({id: '1', status: {indicator, value: ''}}) as Score

const THIRTY_SECONDS = 30 * 1000
const FIVE_MINUTES = 5 * 60 * 1000

describe('athleticsOptions.refetchInterval', () => {
	test('polls every thirty seconds while a game is ongoing', () => {
		const data = [makeScore('O')]
		expect(refetchInterval({state: {data}})).toBe(THIRTY_SECONDS)
	})

	test('polls every five minutes when no game is ongoing', () => {
		const data = [makeScore('A'), makeScore('A')]
		expect(refetchInterval({state: {data}})).toBe(FIVE_MINUTES)
	})

	test('polls every five minutes before any scores have loaded', () => {
		expect(refetchInterval({state: {}})).toBe(FIVE_MINUTES)
	})
})
