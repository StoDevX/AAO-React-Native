import {describe, expect, it} from '@jest/globals'

// query.ts pulls in the redux barrel, which eagerly configures the store and
// wires up the Sentry enhancer -- Sentry's React Native SDK reaches for the
// native fetch module on import, which doesn't exist under Jest. `parseCampus`
// exercises none of that, so stub it out rather than pull in a real store.
jest.mock('../../../redux', () => ({
	selectFavoriteBuildings: jest.fn(),
	useAppSelector: jest.fn(),
}))

import {parseCampus} from '../query'

describe('parseCampus', () => {
	it('recognises carleton', () => {
		expect(parseCampus('carleton')).toBe('carleton')
	})

	it('recognises stolaf', () => {
		expect(parseCampus('stolaf')).toBe('stolaf')
	})

	it('falls back to stolaf for an unknown value, rather than crashing or casting it through', () => {
		expect(parseCampus('northfield')).toBe('stolaf')
	})

	it('falls back to stolaf when the param is undefined', () => {
		expect(parseCampus(undefined)).toBe('stolaf')
	})

	it('falls back to stolaf for an empty string', () => {
		expect(parseCampus('')).toBe('stolaf')
	})
})
