import {describe, expect, it} from '@jest/globals'
import {toSorted} from '../to-sorted'

describe('toSorted', () => {
	it('returns a sorted copy and leaves the original alone', () => {
		let original = [3, 1, 2]
		let sorted = toSorted.call<number[], [(a: number, b: number) => number], number[]>(
			original,
			(a, b) => a - b,
		)

		expect(sorted).toEqual([1, 2, 3])
		expect(original).toEqual([3, 1, 2])
	})

	it('sorts as strings without a comparator, as sort does', () => {
		expect(toSorted.call([10, 9, 1])).toEqual([1, 10, 9])
	})

	it('agrees with the built-in toSorted', () => {
		let names = ['Rolvaag', 'Buntrock', 'Ytterboe', 'Agnes']
		let byLength = (a: string, b: string) => a.length - b.length

		expect(toSorted.call<string[], [typeof byLength], string[]>(names, byLength)).toEqual(
			names.toSorted(byLength),
		)
	})
})
