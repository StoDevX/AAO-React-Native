import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

import {ReportUtils} from '@flakiness/sdk'

import {buildReport, readSimulatorWait} from './write-uitest-flakiness-report.mjs'

/** A failure as xcresulttool reports it under an attempt. */
function failure(message) {
	return {
		name: message,
		nodeType: 'Failure Message',
		sourceLocation: {
			filePath:
				'/Users/runner/work/AAO-React-Native/AAO-React-Native/uitests/Screens/MessFrontPage.swift',
			lineNumber: 140,
		},
	}
}

/** xcresulttool lists these under almost every attempt; they are not failures. */
const RUNTIME_WARNING = {
	name: '[Internal] Thread running at User-interactive quality-of-service class waiting on a thread without a QoS class specified',
	nodeType: 'Runtime Warning',
}

function repetition(index, result, durationInSeconds, children = []) {
	return {
		name: index === 0 ? 'First Run' : `Retry ${index}`,
		nodeIdentifier: String(index + 1),
		nodeType: 'Repetition',
		result,
		durationInSeconds,
		children,
	}
}

function testCase(name, result, durationInSeconds, children = []) {
	return {
		name,
		nodeIdentifier: `ModuleNewsTests/${name}`,
		nodeType: 'Test Case',
		result,
		durationInSeconds,
		children,
	}
}

function suite(name, children) {
	return {name, nodeType: 'Test Suite', result: 'Passed', children}
}

/** Wrap suites in the plan and bundle nodes the real tree has. */
function tree(...suites) {
	return [
		{
			name: 'AllAboutOlaf',
			nodeType: 'Test Plan',
			result: 'Passed',
			children: [
				{
					name: 'AllAboutOlafUITests',
					nodeType: 'UI test bundle',
					result: 'Passed',
					children: suites,
				},
			],
		},
	]
}

const OPTIONS = {
	shard: '2',
	commitId: 'a'.repeat(40),
	url: 'https://github.com/StoDevX/aao-react-native/actions/runs/1',
	osVersion: '27.0',
	xcodeVersion: '27.0',
	testsStartedMs: 1_000_000,
}

/** Build a report and fail if flakiness.io's own schema rejects it. */
function build(testNodes, overrides = {}) {
	const report = buildReport(testNodes, {...OPTIONS, ...overrides})
	assert.equal(ReportUtils.validateReport(report), undefined)
	return report
}

/** The single test in the report's first suite. */
function onlyTest(report) {
	return report.suites[0].tests[0]
}

describe('buildReport', () => {
	it('gives a clean pass one passing attempt', () => {
		const report = build(
			tree(suite('ModuleNewsTests', [testCase('testOpens()', 'Passed', 12.5, [RUNTIME_WARNING])])),
		)

		assert.equal(report.suites[0].title, 'ModuleNewsTests')
		const test = onlyTest(report)
		assert.equal(test.title, 'testOpens()')
		assert.deepEqual(test.attempts, [
			{
				environmentIdx: 0,
				expectedStatus: 'passed',
				status: 'passed',
				startTimestamp: 1_000_000,
				duration: 12_500,
			},
		])
	})

	it('gives a flake one attempt per repetition, with the failure on the first', () => {
		const report = build(
			tree(
				suite('ModuleNewsTests', [
					testCase('testComic()', 'Passed', 179.1, [
						repetition(0, 'Failed', 255.5, [
							failure('XCTAssertTrue failed - the view menu should offer Latest'),
							RUNTIME_WARNING,
						]),
						repetition(1, 'Passed', 102.5, [RUNTIME_WARNING]),
					]),
				]),
			),
		)

		const [first, retry] = onlyTest(report).attempts
		assert.equal(first.status, 'failed')
		assert.equal(first.duration, 255_500)
		assert.deepEqual(first.errors, [
			{message: 'XCTAssertTrue failed - the view menu should offer Latest'},
		])
		assert.equal(retry.status, 'passed')
		assert.equal(retry.errors, undefined)
		assert.equal(onlyTest(report).attempts.length, 2)
	})

	it('runs attempts back to back from when the tests started', () => {
		const report = build(
			tree(
				suite('ModuleNewsTests', [
					testCase('testA()', 'Passed', 1),
					testCase('testB()', 'Passed', 4, [
						repetition(0, 'Failed', 2),
						repetition(1, 'Passed', 3),
					]),
				]),
			),
		)

		const starts = report.suites[0].tests.flatMap((test) =>
			test.attempts.map((attempt) => attempt.startTimestamp),
		)
		assert.deepEqual(starts, [1_000_000, 1_001_000, 1_003_000])
		assert.equal(report.startTimestamp, 1_000_000)
		assert.equal(report.duration, 6_000)
	})

	it('keeps every attempt of a failure that stayed red', () => {
		const report = build(
			tree(
				suite('ModuleNewsTests', [
					testCase('testPhotos()', 'Failed', 77.3, [
						repetition(0, 'Failed', 87.5, [failure('the switch should read 0')]),
						repetition(1, 'Failed', 62.8, [failure('the switch should read 0')]),
						repetition(2, 'Failed', 81.6, [failure('the switch should read 0')]),
					]),
				]),
			),
		)

		assert.deepEqual(
			onlyTest(report).attempts.map((attempt) => attempt.status),
			['failed', 'failed', 'failed'],
		)
	})

	it('reports a skip as expected to skip', () => {
		const attempt = onlyTest(
			build(tree(suite('ModuleNewsTests', [testCase('testSkipped()', 'Skipped', 0)]))),
		).attempts[0]

		assert.equal(attempt.status, 'skipped')
		assert.equal(attempt.expectedStatus, 'skipped')
	})

	it('reports an expected failure as a failure that was expected', () => {
		const attempt = onlyTest(
			build(tree(suite('ModuleNewsTests', [testCase('testKnown()', 'Expected Failure', 1)]))),
		).attempts[0]

		assert.equal(attempt.status, 'failed')
		assert.equal(attempt.expectedStatus, 'failed')
	})

	it('reports a result it does not know as a failure', () => {
		const attempt = onlyTest(
			build(tree(suite('ModuleNewsTests', [testCase('testOdd()', 'Mixed', 1)]))),
		).attempts[0]

		assert.equal(attempt.status, 'failed')
		assert.equal(attempt.expectedStatus, 'passed')
	})

	it('treats a missing duration as zero', () => {
		const report = build(
			tree(suite('ModuleNewsTests', [testCase('testNoTime()', 'Passed', undefined)])),
		)

		assert.equal(onlyTest(report).attempts[0].duration, 0)
		assert.equal(report.duration, 0)
	})

	it('fills in the report fields', () => {
		const report = build(tree(suite('ModuleNewsTests', [testCase('testA()', 'Passed', 1)])))

		assert.equal(report.flakinessProject, 'frogpond/all-about-olaf')
		assert.equal(report.category, 'xcuitest')
		assert.equal(report.title, 'UITests (2)')
		assert.equal(report.commitId, 'a'.repeat(40))
		assert.equal(report.url, OPTIONS.url)
		assert.deepEqual(report.testRunner, {name: 'xcodebuild', version: '27.0'})
		assert.deepEqual(report.environments, [
			{name: 'iOS Simulator', systemData: {osName: 'iOS', osVersion: '27.0'}},
		])
	})

	it('leaves out the runner when the Xcode version is unknown', () => {
		const report = build(tree(suite('ModuleNewsTests', [testCase('testA()', 'Passed', 1)])), {
			xcodeVersion: undefined,
		})

		assert.equal(report.testRunner, undefined)
	})

	describe('the simulator wait', () => {
		const passedWait = {startedMs: 900_000, durationMs: 45_000, exitCode: 0}

		it('becomes CI/waitForSimulator, ahead of the tests', () => {
			const report = build(tree(suite('ModuleNewsTests', [testCase('testA()', 'Passed', 1)])), {
				simulatorWait: passedWait,
			})

			assert.equal(report.suites[0].title, 'CI')
			assert.deepEqual(report.suites[0].tests, [
				{
					title: 'waitForSimulator',
					attempts: [
						{
							environmentIdx: 0,
							expectedStatus: 'passed',
							status: 'passed',
							startTimestamp: 900_000,
							duration: 45_000,
						},
					],
				},
			])
			assert.equal(report.startTimestamp, 900_000)
			assert.equal(report.duration, 101_000)
		})

		it('fails with the exit code when bootstatus failed', () => {
			const report = build([], {simulatorWait: {...passedWait, exitCode: 164}})

			const attempt = onlyTest(report).attempts[0]
			assert.equal(attempt.status, 'failed')
			assert.deepEqual(attempt.errors, [{message: 'simctl bootstatus exited with code 164'}])
		})

		it('still makes a report when there are no test nodes', () => {
			const report = build([], {simulatorWait: passedWait})

			assert.deepEqual(
				report.suites.map((s) => s.title),
				['CI'],
			)
			assert.equal(report.duration, 45_000)
		})

		it('is left out when it was not recorded', () => {
			const report = build(tree(suite('ModuleNewsTests', [testCase('testA()', 'Passed', 1)])))

			assert.deepEqual(
				report.suites.map((s) => s.title),
				['ModuleNewsTests'],
			)
		})
	})

	it('returns null when there is nothing to report', () => {
		assert.equal(buildReport([], OPTIONS), null)
	})
})

describe('readSimulatorWait', () => {
	it('reads the three variables the wait step writes', () => {
		assert.deepEqual(
			readSimulatorWait({
				SIMULATOR_WAIT_STARTED_MS: '900000',
				SIMULATOR_WAIT_DURATION_MS: '45000',
				SIMULATOR_WAIT_EXIT: '0',
			}),
			{startedMs: 900_000, durationMs: 45_000, exitCode: 0},
		)
	})

	it('gives nothing when the step never ran', () => {
		assert.equal(readSimulatorWait({}), undefined)
	})

	it('gives nothing when a value is not a number', () => {
		assert.equal(
			readSimulatorWait({
				SIMULATOR_WAIT_STARTED_MS: '900000',
				SIMULATOR_WAIT_DURATION_MS: '',
				SIMULATOR_WAIT_EXIT: '0',
			}),
			undefined,
		)
	})
})
