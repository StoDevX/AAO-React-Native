import {describe, expect, it} from '@jest/globals'
import {groupBy} from '../group-by'

describe('groupBy', () => {
	it('collects items under the key each one gives, in their order', () => {
		let groups = groupBy([1, 2, 3, 4, 5], (n) => (n % 2 ? 'odd' : 'even'))

		expect(groups.odd).toEqual([1, 3, 5])
		expect(groups.even).toEqual([2, 4])
	})

	it('passes each item its index', () => {
		expect(groupBy(['a', 'b', 'c'], (_, index) => (index < 2 ? 'first' : 'rest'))).toEqual({
			first: ['a', 'b'],
			rest: ['c'],
		})
	})

	it('has no prototype, so a key like "constructor" is just a key', () => {
		let groups = groupBy(['x'], () => 'constructor')

		expect(Object.getPrototypeOf(groups)).toBeNull()
		expect(groups.constructor).toEqual(['x'])
	})

	it('agrees with the built-in Object.groupBy', () => {
		let words = ['apple', 'avocado', 'banana', 'cherry', 'blueberry']
		let byLetter = (word: string) => word.charAt(0)

		expect(groupBy(words, byLetter)).toEqual(Object.groupBy(words, byLetter))
	})
})
