import {describe, expect, test} from '@jest/globals'

import {isContainer, jsonEntries, jsonLeaf, jsonSummary} from '../json-tree'

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
