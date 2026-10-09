import {describe, expect, jest, test} from '@jest/globals'

// A CARLS build: app.config.ts's `extra.app` names it.
jest.mock('../../../lib/app-identity', () => ({APP: 'carls'}))

import {CAMPUS_IS_FIXED, useCampusStore} from '../store'

describe('in CARLS', () => {
	test('starts at Carleton', () => {
		expect(CAMPUS_IS_FIXED).toBe(true)
		expect(useCampusStore.getState().campus).toBe('carleton')
	})

	test('stays at Carleton when asked to switch', () => {
		useCampusStore.getState().setCampus('stolaf')
		expect(useCampusStore.getState().campus).toBe('carleton')
	})
})
