import {describe, expect, test} from '@jest/globals'

import {sameShowTitle} from '../show-titles'

describe('sameShowTitle', () => {
	test.each([
		['HOZ', 'hoz'],
		['Cafecito Hour', '  Cafecito   Hour '],
		['HOZ', 'HOZ!'],
		['Damn the Man, Save the Carl', 'Damn the Man, Save the Carl...'],
		["Ella's Hour", 'Ella’s Hour'],
	])('matches %p and %p', (one, two) => {
		expect(sameShowTitle(one, two)).toBe(true)
	})

	test.each([
		['HOZ', 'HOZ 2'],
		['Cafecito Hour', 'Cafecito'],
		['!!!', ''],
	])('tells %p and %p apart', (one, two) => {
		expect(sameShowTitle(one, two)).toBe(false)
	})
})
