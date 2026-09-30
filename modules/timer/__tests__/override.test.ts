import {describe, expect, it} from '@jest/globals'
import {useNowOverride} from '../override'

describe('the frozen-moment override', () => {
	// Reads the store as the module creates it, so nothing here may freeze or
	// clear it first. Freezing and clearing are tested through `now()` in
	// index.test.ts.
	it('starts with no override', () => {
		expect(useNowOverride.getState().frozen).toBeNull()
	})
})
