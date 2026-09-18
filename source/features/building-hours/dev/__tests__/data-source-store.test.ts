import {beforeEach, describe, expect, it} from '@jest/globals'
import {useForceBundledData} from '../data-source-store'

describe('the bundled-data override', () => {
	beforeEach(() => {
		useForceBundledData.getState().setForced(false)
	})

	it('starts off', () => {
		expect(useForceBundledData.getState().forced).toBe(false)
	})

	it('turns on', () => {
		useForceBundledData.getState().setForced(true)

		expect(useForceBundledData.getState().forced).toBe(true)
	})
})
