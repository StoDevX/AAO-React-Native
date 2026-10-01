import {describe, expect, test} from '@jest/globals'

import {uiTestFixture} from '../ui-test-fixture'

describe('uiTestFixture', () => {
	test('hands back a fixture with data in it', () => {
		let map = {type: 'FeatureCollection', features: []}
		expect(uiTestFixture('stolaf-map.json', map)).toBe(map)
	})

	// A bundle built for release carries `{}` in place of each fixture
	// (metro.config.js); a UI test reading one should say so, not fail later.
	test('refuses the empty stub, naming the fixture and the fix', () => {
		expect(() => uiTestFixture('stolaf-map.json', {})).toThrow('stolaf-map.json')
		expect(() => uiTestFixture('stolaf-map.json', {})).toThrow('KEEP_UITEST_FIXTURES=1')
	})
})
