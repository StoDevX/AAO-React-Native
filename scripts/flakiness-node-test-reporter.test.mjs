import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

import {ReportUtils} from '@flakiness/sdk'

import {buildReport} from './flakiness-node-test-reporter.mjs'

const CWD = '/repo'

/**
 * A `test:pass` or `test:fail` event as node:test hands it to a reporter,
 * with the time the reporter received it.
 */
function event(
	name,
	{
		nesting = 0,
		file = 'scripts/a.test.mjs',
		line = 1,
		column = 1,
		type = 'test',
		durationMs = 2,
		error,
		skip,
		todo,
		receivedAt = 1_000_100,
	} = {},
) {
	return {
		type: error ? 'test:fail' : 'test:pass',
		receivedAt,
		data: {
			name,
			nesting,
			file: `${CWD}/${file}`,
			line,
			column,
			skip,
			todo,
			details: {type, duration_ms: durationMs, error},
		},
	}
}

/** A failure as node:test reports it: the assertion is the cause. */
function testFailure(message) {
	return Object.assign(new Error('test failed'), {
		code: 'ERR_TEST_FAILURE',
		failureType: 'testCodeFailure',
		cause: Object.assign(new Error(message), {name: 'AssertionError'}),
	})
}

const OPTIONS = {
	cwd: CWD,
	commitId: 'b'.repeat(40),
	url: 'https://github.com/StoDevX/aao-react-native/actions/runs/1',
	nodeVersion: '24.21.0',
	environment: {
		name: 'node:test',
		systemData: {osName: 'Linux', osVersion: '6.8.0', osArch: 'x64'},
	},
	startTimestamp: 1_000_000,
	finishTimestamp: 1_005_000,
}

/** Build a report and fail if flakiness.io's own schema rejects it. */
function build(events, overrides = {}) {
	const report = buildReport(events, {...OPTIONS, ...overrides})
	assert.equal(ReportUtils.validateReport(report), undefined)
	return report
}

describe('buildReport', () => {
	it('puts a top-level test in a suite for its file, with its location', () => {
		const report = build([event('parses a row', {line: 12, column: 3})])

		assert.deepEqual(report.suites, [
			{
				type: 'file',
				title: 'scripts/a.test.mjs',
				tests: [
					{
						title: 'parses a row',
						location: {file: 'scripts/a.test.mjs', line: 12, column: 3},
						attempts: [
							{
								environmentIdx: 0,
								expectedStatus: 'passed',
								status: 'passed',
								startTimestamp: 1_000_098,
								duration: 2,
							},
						],
					},
				],
			},
		])
	})

	it('nests describe blocks, which node:test reports after their tests', () => {
		const report = build([
			event('deep pass', {nesting: 2, line: 6}),
			event('inner', {nesting: 1, line: 5, type: 'suite'}),
			event('shallow pass', {nesting: 1, line: 8}),
			event('outer', {nesting: 0, line: 4, type: 'suite'}),
		])

		const [outer] = report.suites[0].suites
		assert.equal(outer.type, 'suite')
		assert.equal(outer.title, 'outer')
		assert.deepEqual(outer.location, {file: 'scripts/a.test.mjs', line: 4, column: 1})
		assert.deepEqual(
			outer.tests.map((test) => test.title),
			['shallow pass'],
		)
		assert.equal(outer.suites[0].title, 'inner')
		assert.deepEqual(
			outer.suites[0].tests.map((test) => test.title),
			['deep pass'],
		)
		assert.equal(report.suites[0].tests, undefined)
	})

	it('keeps a test that has subtests as a suite, so the subtests are not lost', () => {
		const report = build([event('child', {nesting: 1}), event('parent', {nesting: 0})])

		const [parent] = report.suites[0].suites
		assert.equal(parent.title, 'parent')
		assert.deepEqual(
			parent.tests.map((test) => test.title),
			['child'],
		)
	})

	it('reports a failure with the assertion message', () => {
		const report = build([
			event('adds up', {error: testFailure('Expected values to be strictly equal:\n\n1 !== 2\n')}),
		])

		const [attempt] = report.suites[0].tests[0].attempts
		assert.equal(attempt.status, 'failed')
		assert.deepEqual(attempt.errors, [
			{message: 'Expected values to be strictly equal:\n\n1 !== 2\n'},
		])
	})

	it('falls back to the error itself when it has no cause', () => {
		const report = build([
			event('/repo/scripts/a.test.mjs', {error: new Error('Promise resolution is still pending')}),
		])

		assert.deepEqual(report.suites[0].tests[0].attempts[0].errors, [
			{message: 'Promise resolution is still pending'},
		])
	})

	it('reports skipped and todo tests as expected to skip', () => {
		const report = build([event('later', {skip: true}), event('someday', {todo: 'not yet'})])

		for (const test of report.suites[0].tests) {
			assert.equal(test.attempts[0].status, 'skipped')
			assert.equal(test.attempts[0].expectedStatus, 'skipped')
		}
	})

	it('keeps each file apart even when their events interleave', () => {
		const report = build([
			event('a one', {file: 'scripts/a.test.mjs', nesting: 1}),
			event('b top', {file: 'scripts/b.test.mjs'}),
			event('a suite', {file: 'scripts/a.test.mjs', type: 'suite'}),
		])

		assert.deepEqual(
			report.suites.map((suite) => suite.title),
			['scripts/a.test.mjs', 'scripts/b.test.mjs'],
		)
		assert.deepEqual(
			report.suites[0].suites[0].tests.map((test) => test.title),
			['a one'],
		)
		assert.deepEqual(
			report.suites[1].tests.map((test) => test.title),
			['b top'],
		)
	})

	it('fills in the report fields', () => {
		const report = build([event('one')])

		assert.equal(report.flakinessProject, 'frogpond/all-about-olaf')
		assert.equal(report.category, 'node:test')
		assert.equal(report.commitId, 'b'.repeat(40))
		assert.equal(report.url, OPTIONS.url)
		assert.deepEqual(report.testRunner, {name: 'node:test', version: '24.21.0'})
		assert.deepEqual(report.runtime, {name: 'node', version: '24.21.0'})
		assert.deepEqual(report.environments, [OPTIONS.environment])
		assert.equal(report.startTimestamp, 1_000_000)
		assert.equal(report.duration, 5_000)
	})

	it('leaves out the url when there is no run to link', () => {
		assert.equal(build([event('one')], {url: undefined}).url, undefined)
	})

	it('returns null when no test ran', () => {
		assert.equal(buildReport([], OPTIONS), null)
	})
})
