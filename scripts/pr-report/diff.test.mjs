import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

import {diffGroups, diffPackages, diffReports} from './diff.mjs'

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

describe('diffPackages', () => {
	it('sorts added, removed and bumped packages by name', () => {
		let before = {react: ['19.2.2'], lodash: ['4.17.21'], same: ['1.0.0']}
		let after = {react: ['19.2.3'], 'date-fns': ['4.1.0'], same: ['1.0.0']}
		assert.deepEqual(diffPackages(before, after).changes, [
			{name: 'date-fns', kind: 'added', before: null, after: ['4.1.0']},
			{name: 'lodash', kind: 'removed', before: ['4.17.21'], after: null},
			{name: 'react', kind: 'bumped', before: ['19.2.2'], after: ['19.2.3']},
		])
	})

	it('does not report a package whose versions are unchanged', () => {
		assert.deepEqual(diffPackages({a: ['1.0.0', '2.0.0']}, {a: ['1.0.0', '2.0.0']}), {
			changes: [],
			duplicates: [{name: 'a', versions: ['1.0.0', '2.0.0'], isNew: false}],
		})
	})

	it('reports a package gaining a second version as a bump and a new duplicate', () => {
		let result = diffPackages({a: ['1.0.0']}, {a: ['1.0.0', '2.0.0']})
		assert.deepEqual(result.changes, [
			{name: 'a', kind: 'bumped', before: ['1.0.0'], after: ['1.0.0', '2.0.0']},
		])
		assert.deepEqual(result.duplicates, [{name: 'a', versions: ['1.0.0', '2.0.0'], isNew: true}])
	})

	it('treats a new package with two versions as a new duplicate', () => {
		assert.deepEqual(diffPackages({}, {a: ['1.0.0', '2.0.0']}).duplicates, [
			{name: 'a', versions: ['1.0.0', '2.0.0'], isNew: true},
		])
	})

	it('lists no duplicate for a package with one version', () => {
		assert.deepEqual(diffPackages({}, {a: ['1.0.0']}).duplicates, [])
	})
})

describe('diffReports', () => {
	it('diffs the hermes total, both groupings and the dependencies', () => {
		let report = (hermesBytes, nodeModulesBytes, packages) => ({
			version: 3,
			baseSha: null,
			js: {hermesBytes, byPackage: {a: hermesBytes}, byFeature: {}},
			deps: {nodeModulesBytes, packages},
		})
		assert.deepEqual(
			diffReports(report(200, 1000, {a: ['1.0.0']}), report(230, 1500, {a: ['1.1.0']})),
			{
				hermes: {name: 'hermes', before: 200, after: 230, delta: 30},
				byPackage: [{name: 'a', before: 200, after: 230, delta: 30}],
				byFeature: [],
				deps: {
					nodeModules: {name: 'node_modules', before: 1000, after: 1500, delta: 500},
					changes: [{name: 'a', kind: 'bumped', before: ['1.0.0'], after: ['1.1.0']}],
					duplicates: [],
				},
			},
		)
	})
})
