import {describe, expect, it, jest} from '@jest/globals'
import {groupBy, memoize, sample, sortBy} from '../collections'

describe('sortBy', () => {
	it('sorts a copy by each key in turn, keeping ties in order', () => {
		let jobs = [
			{status: 'b', name: 'z'},
			{status: 'a', name: 'y'},
			{status: 'b', name: 'x'},
			{status: 'a', name: 'y2'},
		]
		let sorted = sortBy(jobs, (j) => j.status)

		expect(sorted.map((j) => j.name)).toEqual(['y', 'y2', 'z', 'x'])
		expect(jobs[0]?.name).toBe('z')
		expect(
			sortBy(
				jobs,
				(j) => j.status,
				(j) => j.name,
			).map((j) => j.name),
		).toEqual(['y', 'y2', 'x', 'z'])
	})

	it('sorts by the values themselves without a key', () => {
		expect(sortBy([2017, 2016, 2018])).toEqual([2016, 2017, 2018])
		expect(sortBy([10, 9, 1])).toEqual([1, 9, 10])
	})
})

describe('sample', () => {
	it('picks one of the items', () => {
		expect(['a', 'b', 'c']).toContain(sample(['a', 'b', 'c']))
	})

	it('has nothing to pick from an empty list', () => {
		expect(sample([])).toBeUndefined()
	})
})

describe('memoize', () => {
	it('computes once for each first argument', () => {
		let compute = jest.fn((n: number) => n * 2)
		let remembered = memoize(compute)

		expect(remembered(2)).toBe(4)
		expect(remembered(2)).toBe(4)
		expect(remembered(3)).toBe(6)
		expect(compute).toHaveBeenCalledTimes(2)
	})
})

describe('groupBy', () => {
	it('collects items under the key each one gives, in order', () => {
		expect(groupBy(['apple', 'banana', 'avocado'], (word) => word.charAt(0))).toEqual({
			a: ['apple', 'avocado'],
			b: ['banana'],
		})
	})

	it('files an item with no key under "undefined", as a string key would read it', () => {
		let modes = [{category: 'Bus'}, {category: undefined}]

		expect(Object.keys(groupBy(modes, (mode) => mode.category))).toEqual(['Bus', 'undefined'])
	})
})
