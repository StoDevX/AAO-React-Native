import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

import {ReportUtils} from '@flakiness/sdk'

import {buildDurationsRequest, readPredictedDurations} from './fetch-uitest-durations.mjs'
import {discoverTests} from './split-uitests.mjs'
import {buildReport} from './write-uitest-flakiness-report.mjs'

/** Every test in a report, as `suite/title`, wherever its suite is nested. */
function testNames(suites = []) {
	return suites.flatMap((suite) => [
		...(suite.tests ?? []).map((test) => `${suite.title}/${test.title}`),
		...testNames(suite.suites),
	])
}

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

	it('names each test exactly as a shard uploads it', () => {
		const classes = discoverTests([
			{
				name: 'ModuleNewsTests.swift',
				text: 'class ModuleNewsTests: UITestCase {\n\tfunc testOne() throws {}\n}\n',
			},
		])
		const uploaded = buildReport(
			[
				{
					name: 'AllAboutOlaf',
					nodeType: 'Test Plan',
					children: [
						{
							name: 'AllAboutOlafUITests',
							nodeType: 'UI test bundle',
							children: [
								{
									name: 'ModuleNewsTests',
									nodeType: 'Test Suite',
									children: [
										{
											name: 'testOne()',
											nodeType: 'Test Case',
											result: 'Passed',
											durationInSeconds: 1,
										},
									],
								},
							],
						},
					],
				},
			],
			{shard: '1', commitId: 'a'.repeat(40), osVersion: '27.0', testsStartedMs: 1000},
		)
		const request = buildDurationsRequest(classes, {commitId: 'a'.repeat(40), now: 1000})

		assert.equal(request.category, uploaded.category)
		assert.equal(request.environments[0].name, uploaded.environments[0].name)
		assert.deepEqual(testNames(request.suites), testNames(uploaded.suites))
	})

	it('passes flakiness.io’s own report schema', () => {
		const request = buildDurationsRequest([{className: 'ModuleHomeTests', methods: ['testOne']}], {
			commitId: 'a'.repeat(40),
			now: 1000,
		})

		assert.equal(ReportUtils.validateReport(request), undefined)
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
