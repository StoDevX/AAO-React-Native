import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

import {buildDurationsRequest, readPredictedDurations} from './fetch-uitest-durations.mjs'

/** Stand in for flakiness.io by giving each named test one predicted attempt. */
function answer(request, predictions) {
	return {
		...request,
		suites: request.suites.map((suite) => ({
			...suite,
			tests: suite.tests.map((test) => {
				const duration = predictions[`${suite.title}/${test.title}`]
				return {
					...test,
					attempts: duration === undefined ? [] : [{environmentIdx: 0, duration}],
				}
			}),
		})),
	}
}

describe('buildDurationsRequest', () => {
	it('names each test as the shards upload it: class, then method with parentheses', () => {
		const request = buildDurationsRequest(
			[{className: 'ModuleHomeTests', methods: ['testOne', 'testTwo']}],
			{commitId: 'abc123', now: 1000},
		)

		assert.equal(request.commitId, 'abc123')
		assert.equal(request.category, 'xcuitest')
		assert.deepEqual(request.suites, [
			{
				type: 'suite',
				title: 'ModuleHomeTests',
				tests: [
					{title: 'testOne()', attempts: []},
					{title: 'testTwo()', attempts: []},
				],
			},
		])
	})
})

describe('readPredictedDurations', () => {
	it('keys each prediction the way the planner looks it up, in seconds', () => {
		const request = buildDurationsRequest(
			[
				{className: 'ModuleHomeTests', methods: ['testOne']},
				{className: 'ModuleNewsTests', methods: ['testTwo']},
			],
			{commitId: 'abc123', now: 1000},
		)

		assert.deepEqual(
			readPredictedDurations(
				answer(request, {
					'ModuleHomeTests/testOne()': 109484,
					'ModuleNewsTests/testTwo()': 98377,
				}),
			),
			{'ModuleHomeTests/testOne()': 109.484, 'ModuleNewsTests/testTwo()': 98.377},
		)
	})

	it('leaves out a test flakiness.io has no history for', () => {
		const request = buildDurationsRequest(
			[{className: 'ModuleHomeTests', methods: ['testOld', 'testNew']}],
			{commitId: 'abc123', now: 1000},
		)

		assert.deepEqual(readPredictedDurations(answer(request, {'ModuleHomeTests/testOld()': 5000})), {
			'ModuleHomeTests/testOld()': 5,
		})
	})

	it('reads a report with no suites as no predictions', () => {
		assert.deepEqual(readPredictedDurations({}), {})
	})
})
