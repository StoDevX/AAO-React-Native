import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

import {findFlakyTests, formatReport} from './report-flaky-uitests.mjs'

/** A `Test Case` node as `xcresulttool get test-results tests` emits it. */
function testCase(name, result, repetitions = [], extraChildren = []) {
	return {
		name,
		nodeIdentifier: `SomeTests/${name}`,
		nodeType: 'Test Case',
		result,
		children: [
			...repetitions.map((repResult, index) => ({
				name: index === 0 ? 'First Run' : `Retry ${index}`,
				nodeIdentifier: String(index + 1),
				nodeType: 'Repetition',
				result: repResult,
			})),
			...extraChildren,
		],
	}
}

/** Wrap cases in the suite/target nesting the real tree has. */
function tree(...cases) {
	return [
		{
			name: 'AllAboutOlaf',
			nodeType: 'Test Plan',
			children: [
				{
					name: 'AllAboutOlafUITests',
					nodeType: 'Test Suite',
					children: cases,
				},
			],
		},
	]
}

describe('findFlakyTests', () => {
	it('reports nothing when no test was retried', () => {
		const nodes = tree(testCase('testAlwaysPasses()', 'Passed'))

		assert.deepEqual(findFlakyTests(nodes), [])
	})

	it('reports a test that passed after a failed attempt', () => {
		const nodes = tree(testCase('testPassesOnRetry()', 'Passed', ['Failed', 'Passed']))

		assert.deepEqual(findFlakyTests(nodes), [
			{
				identifier: 'SomeTests/testPassesOnRetry()',
				attempts: 2,
			},
		])
	})

	it('does not report a test that failed every attempt', () => {
		const nodes = tree(testCase('testAlwaysFails()', 'Failed', ['Failed', 'Failed', 'Failed']))

		assert.deepEqual(findFlakyTests(nodes), [])
	})

	it('does not report a test whose repetitions all passed', () => {
		const nodes = tree(testCase('testPassesEveryTime()', 'Passed', ['Passed', 'Passed']))

		assert.deepEqual(findFlakyTests(nodes), [])
	})

	it('does not report a test whose failing child is not a Repetition', () => {
		const nodes = tree(
			testCase(
				'testPassesWithFailureMessage()',
				'Passed',
				[],
				[
					{
						name: 'Some assertion',
						nodeType: 'Failure Message',
						result: 'Failed',
					},
				],
			),
		)

		assert.deepEqual(findFlakyTests(nodes), [])
	})
})

describe('formatReport', () => {
	it('produces nothing when no test flaked', () => {
		assert.deepEqual(formatReport([]), {annotations: [], summary: ''})
	})

	it('warns once per flaky test', () => {
		const {annotations} = formatReport([
			{identifier: 'A/testOne()', attempts: 2},
			{identifier: 'B/testTwo()', attempts: 3},
		])

		assert.deepEqual(annotations, [
			'::warning title=Flaky UITest::A/testOne() passed only after a retry (2 attempts)',
			'::warning title=Flaky UITest::B/testTwo() passed only after a retry (3 attempts)',
		])
	})

	it('tabulates the flaky tests in the summary', () => {
		const {summary} = formatReport([{identifier: 'A/testOne()', attempts: 2}])

		assert.ok(summary.includes('1 test passed only after a retry'))
		assert.ok(summary.includes('| `A/testOne()` | 2 |'))
	})

	it('counts more than one flaky test in plural', () => {
		const {summary} = formatReport([
			{identifier: 'A/testOne()', attempts: 2},
			{identifier: 'B/testTwo()', attempts: 2},
		])

		assert.ok(summary.includes('2 tests passed only after a retry'))
	})
})
