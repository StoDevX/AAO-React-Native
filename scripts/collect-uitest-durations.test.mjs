import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

import {collectDurations} from './collect-uitest-durations.mjs'

/** A `Test Case` node as `xcresulttool get test-results tests` emits it. */
function testCase(name, result, durationInSeconds) {
	return {
		name: `${name}()`,
		nodeIdentifier: `SomeTests/${name}()`,
		nodeType: 'Test Case',
		result,
		durationInSeconds,
	}
}

/** Wrap cases in the suite/target nesting the real tree has. */
function tree(...cases) {
	return [
		{
			name: 'AllAboutAnything',
			nodeType: 'Test Plan',
			children: [{name: 'AllAboutAnythingUITests', nodeType: 'Test Suite', children: cases}],
		},
	]
}

describe('collectDurations', () => {
	it('records the duration of a passing test', () => {
		assert.deepEqual(collectDurations(tree(testCase('testOne', 'Passed', 12.5))), {
			'SomeTests/testOne()': 12.5,
		})
	})

	it('ignores skipped tests, whose near-zero duration is not a measurement', () => {
		assert.deepEqual(
			collectDurations(
				tree(testCase('testOne', 'Passed', 12.5), testCase('testTwo', 'Skipped', 0.4)),
			),
			{'SomeTests/testOne()': 12.5},
		)
	})

	it('ignores failed tests, which stop early and under-report', () => {
		assert.deepEqual(collectDurations(tree(testCase('testOne', 'Failed', 3))), {})
	})

	it('ignores a passing test with no duration recorded', () => {
		assert.deepEqual(collectDurations(tree(testCase('testOne', 'Passed', 0))), {})
	})

	it("takes a retried test's passing attempt, not the mean Xcode reports over its attempts", () => {
		let retried = {
			...testCase('testOne', 'Passed', 143.08),
			children: [
				{nodeType: 'Repetition', name: 'First Run', result: 'Failed', durationInSeconds: 236.59},
				{nodeType: 'Repetition', name: 'Retry 1', result: 'Passed', durationInSeconds: 49.57},
			],
		}
		assert.deepEqual(collectDurations(tree(retried)), {'SomeTests/testOne()': 49.57})
	})

	it('returns an empty table for an empty tree', () => {
		assert.deepEqual(collectDurations([]), {})
		assert.deepEqual(collectDurations(undefined), {})
	})
})
