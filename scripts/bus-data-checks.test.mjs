import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {findDuplicateLines, todayInChicago} from './bus-data-checks.mjs'

describe('findDuplicateLines', () => {
	it('returns nothing for an empty list', () => {
		assert.deepEqual(findDuplicateLines([]), [])
	})

	it('returns nothing when every file publishes a different line', () => {
		let entries = [
			{file: '1-express.yaml', line: 'Express'},
			{file: '3-red-line.yaml', line: 'Red Line'},
		]

		assert.deepEqual(findDuplicateLines(entries), [])
	})

	it('reports one line published by two files', () => {
		let entries = [
			{file: '4-blue-line.yaml', line: 'Blue Line'},
			{file: 'blue-line.yaml', line: 'Blue Line'},
		]

		assert.deepEqual(findDuplicateLines(entries), [
			{line: 'Blue Line', files: ['4-blue-line.yaml', 'blue-line.yaml']},
		])
	})

	it('reports one line published by three files as a single group', () => {
		let entries = [
			{file: 'a.yaml', line: 'Blue Line'},
			{file: 'b.yaml', line: 'Blue Line'},
			{file: 'c.yaml', line: 'Blue Line'},
		]

		assert.deepEqual(findDuplicateLines(entries), [
			{line: 'Blue Line', files: ['a.yaml', 'b.yaml', 'c.yaml']},
		])
	})
})

describe('todayInChicago', () => {
	it('reads the earlier calendar date once UTC has already rolled to the next day', () => {
		// 21:00 in Chicago (UTC-6 in January) on New Year's Eve is already
		// 03:00 UTC on New Year's Day -- the exact case that shipped as a bug.
		let instant = new Date('2026-01-01T03:00:00Z')

		assert.equal(todayInChicago(instant), '20251231')
	})

	it('agrees with UTC away from the midnight boundary', () => {
		let instant = new Date('2026-06-15T18:00:00Z')

		assert.equal(todayInChicago(instant), '20260615')
	})
})
