import {describe, expect, it} from '@jest/globals'
import {isEqual} from '../is-equal'

describe('isEqual', () => {
	it('compares values the way === does, but NaN equals NaN', () => {
		expect(isEqual(1, 1)).toBe(true)
		expect(isEqual('a', 'b')).toBe(false)
		expect(isEqual(Number.NaN, Number.NaN)).toBe(true)
		expect(isEqual(null, undefined)).toBe(false)
	})

	it('compares arrays and objects by what they hold', () => {
		expect(isEqual({title: 'Vegan', tags: ['v', 'gf']}, {tags: ['v', 'gf'], title: 'Vegan'})).toBe(
			true,
		)
		expect(isEqual({title: 'Vegan'}, {title: 'Vegan', extra: 1})).toBe(false)
		expect(isEqual([1, [2, 3]], [1, [2, 3]])).toBe(true)
		expect(isEqual([1, 2], [2, 1])).toBe(false)
	})

	it('treats an array and an object with the same keys as different', () => {
		expect(isEqual(['a'], {0: 'a'})).toBe(false)
	})

	it('compares dates by when they are', () => {
		expect(isEqual(new Date(0), new Date(0))).toBe(true)
		expect(isEqual(new Date(0), new Date(1))).toBe(false)
	})
})
