import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

import {diffGroups, diffReports} from './diff.mjs'

describe('diffGroups', () => {
	it('orders by size of change, largest first, then by name', () => {
		assert.deepEqual(diffGroups({a: 10, b: 10, c: 10}, {a: 11, b: 5, c: 15}), [
			{name: 'b', before: 10, after: 5, delta: -5},
			{name: 'c', before: 10, after: 15, delta: 5},
			{name: 'a', before: 10, after: 11, delta: 1},
		])
	})

	it('gives a new group no before figure and a removed one no after figure', () => {
		assert.deepEqual(diffGroups({gone: 4}, {fresh: 6}), [
			{name: 'fresh', before: null, after: 6, delta: 6},
			{name: 'gone', before: 4, after: null, delta: -4},
		])
	})

	it('keeps unchanged groups, with a delta of zero', () => {
		assert.deepEqual(diffGroups({a: 1}, {a: 1}), [{name: 'a', before: 1, after: 1, delta: 0}])
	})
})

describe('diffReports', () => {
	it('diffs the hermes total and both groupings', () => {
		let report = (hermesBytes) => ({
			version: 1,
			baseSha: null,
			js: {hermesBytes, byPackage: {a: hermesBytes}, byFeature: {}},
		})
		assert.deepEqual(diffReports(report(200), report(230)), {
			hermes: {name: 'hermes', before: 200, after: 230, delta: 30},
			byPackage: [{name: 'a', before: 200, after: 230, delta: 30}],
			byFeature: [],
		})
	})
})
