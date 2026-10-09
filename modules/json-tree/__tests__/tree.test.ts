import {describe, expect, test} from '@jest/globals'

import {isContainer, jsonEntries, jsonLeaf, jsonSummary, SMALL_GROUP, startsOpen} from '../tree'

describe('isContainer', () => {
	test('opens objects and arrays, and nothing else', () => {
		expect(isContainer({a: 1})).toBe(true)
		expect(isContainer([1])).toBe(true)
		expect(isContainer(null)).toBe(false)
		expect(isContainer('text')).toBe(false)
		expect(isContainer(3)).toBe(false)
	})
})

describe('jsonEntries', () => {
	test("lists an object's keys in order", () => {
		expect(jsonEntries({path: '/', methods: ['GET']})).toEqual([
			{key: 'path', value: '/'},
			{key: 'methods', value: ['GET']},
		])
	})

	test("lists an array's items by index", () => {
		expect(jsonEntries(['a', 'b'])).toEqual([
			{key: '0', value: 'a'},
			{key: '1', value: 'b'},
		])
	})
})

describe('jsonSummary', () => {
	test('counts what an object or array holds, in its own brackets', () => {
		expect(jsonSummary({a: 1, b: 2})).toBe('{2}')
		expect(jsonSummary([1, 2, 3])).toBe('[3]')
		expect(jsonSummary([])).toBe('[0]')
	})
})

describe('jsonLeaf', () => {
	test('quotes a string, as JSON writes it', () => {
		expect(jsonLeaf('/_cache')).toEqual({text: '"/_cache"', kind: 'string'})
		expect(jsonLeaf('say "hi"')).toEqual({text: '"say \\"hi\\""', kind: 'string'})
	})

	test('writes numbers, booleans and null bare', () => {
		expect(jsonLeaf(262)).toEqual({text: '262', kind: 'number'})
		expect(jsonLeaf(false)).toEqual({text: 'false', kind: 'boolean'})
		expect(jsonLeaf(null)).toEqual({text: 'null', kind: 'null'})
	})
})

describe('startsOpen', () => {
	test('opens a group whose whole contents are a few values', () => {
		expect(startsOpen({value: '262', label: 'cage'})).toBe(true)
		expect(startsOpen(['GET'])).toBe(true)
		expect(startsOpen({in: 'query', values: [{value: 'a'}, {value: 'b'}]})).toBe(true)
	})

	test(`keeps a group closed once it holds more than ${SMALL_GROUP} values, however deep`, () => {
		let many = Array.from({length: SMALL_GROUP + 1}, (_, index) => index)
		expect(startsOpen(many)).toBe(false)
		expect(startsOpen({nested: {deeper: many}})).toBe(false)
	})

	test('opens a group of exactly the limit', () => {
		expect(startsOpen(Array.from({length: SMALL_GROUP}, (_, index) => index))).toBe(true)
	})

	test('stops counting a huge group once past the limit', () => {
		// items beyond the limit throw when read, so counting any of them fails
		let huge: unknown[] = Array.from({length: SMALL_GROUP + 1}, (_, index) => index)
		for (let index = SMALL_GROUP + 1; index < 100_000; index++) {
			Object.defineProperty(huge, index, {
				enumerable: true,
				get: () => {
					throw new Error(`read item ${index}, past the limit`)
				},
			})
		}
		expect(startsOpen(huge)).toBe(false)
	})
})
