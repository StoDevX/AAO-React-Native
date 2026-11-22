import {describe, expect, test} from '@jest/globals'

import {parseFeatureSwitches} from '../feature-switches'

describe('parseFeatureSwitches', () => {
	test('keeps every feature section as published', () => {
		expect(parseFeatureSwitches({data: {radio: {ksto: {enabled: true}}, chat: {}}})).toEqual({
			radio: {ksto: {enabled: true}},
			chat: {},
		})
	})

	test('rejects a body with no data object', () => {
		expect(() => parseFeatureSwitches({})).toThrow()
		expect(() => parseFeatureSwitches({data: []})).toThrow()
	})
})
