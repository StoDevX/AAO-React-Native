import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

import {ReportUtils} from '@flakiness/sdk'

import {
	buildReport,
	parseTestTags,
	readRunnerLoad,
	readSimulatorOsVersion,
	readSimulatorWait,
} from './write-uitest-flakiness-report.mjs'

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

/** xcresulttool lists these under almost every attempt. */
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
		const report = build(tree(suite('ModuleNewsTests', [testCase('testOpens()', 'Passed', 12.5)])))

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

	it("puts every attempt, the simulator wait's too, in the shard's lane", () => {
		const report = build(
			tree(
				suite('ModuleNewsTests', [
					testCase('testB()', 'Passed', 4, [
						repetition(0, 'Failed', 2),
						repetition(1, 'Passed', 3),
					]),
				]),
			),
			{parallelIndex: 1, simulatorWait: {startedMs: 900_000, durationMs: 45_000, exitCode: 0}},
		)

		const lanes = report.suites.flatMap((s) =>
			s.tests.flatMap((test) => test.attempts.map((a) => a.parallelIndex)),
		)
		assert.deepEqual(lanes, [1, 1, 1])
	})

	it('leaves the lane out when the shard is unknown', () => {
		const report = build(tree(suite('ModuleNewsTests', [testCase('testA()', 'Passed', 1)])))

		assert.equal(onlyTest(report).attempts[0].parallelIndex, undefined)
	})

	it("carries the runner's load into the report", () => {
		const runnerLoad = readRunnerLoad(
			[
				'{"cpuCount":3,"ramBytes":7000}',
				'{"t":1000000,"cpuAvg":10,"cpuMax":20,"ram":50}',
				'{"t":1002000,"cpuAvg":90,"cpuMax":95,"ram":60}',
			].join('\n'),
		)
		const report = build(tree(suite('ModuleNewsTests', [testCase('testA()', 'Passed', 1)])), {
			runnerLoad,
		})

		assert.equal(report.cpuCount, 3)
		assert.equal(report.ramBytes, 7000)
		assert.deepEqual(report.cpuAvg, [
			[1_000_000, 10],
			[2000, 90],
		])
	})

	it('annotates an attempt with its runtime warnings, each once', () => {
		const report = build(
			tree(
				suite('ModuleNewsTests', [
					testCase('testA()', 'Passed', 1, [RUNTIME_WARNING, RUNTIME_WARNING]),
				]),
			),
		)

		assert.deepEqual(onlyTest(report).attempts[0].annotations, [
			{type: 'runtime-warning', description: RUNTIME_WARNING.name},
		])
	})

	it('annotates each retry with its own runtime warnings', () => {
		const report = build(
			tree(
				suite('ModuleNewsTests', [
					testCase('testB()', 'Passed', 4, [
						repetition(0, 'Failed', 2, [failure('flaked'), RUNTIME_WARNING]),
						repetition(1, 'Passed', 2),
					]),
				]),
			),
		)

		const [first, retry] = onlyTest(report).attempts
		assert.deepEqual(first.annotations, [
			{type: 'runtime-warning', description: RUNTIME_WARNING.name},
		])
		assert.equal(retry.annotations, undefined)
	})

	it("annotates a skip and an expected failure with Xcode's reason", () => {
		const report = build(
			tree(
				suite('ModuleNewsTests', [
					testCase('testSkipped()', 'Skipped', 0, [
						{name: 'a chaos run needs AAO_CHAOS_SEED', nodeType: 'Skip Message'},
					]),
					testCase('testKnown()', 'Expected Failure', 1, [
						{name: 'the map tiles 404 until the next publish', nodeType: 'Expected Failure'},
					]),
				]),
			),
		)

		const [skipped, known] = report.suites[0].tests
		assert.deepEqual(skipped.attempts[0].annotations, [
			{type: 'skip', description: 'a chaos run needs AAO_CHAOS_SEED'},
		])
		assert.deepEqual(known.attempts[0].annotations, [
			{type: 'fail', description: 'the map tiles 404 until the next publish'},
		])
	})

	it('tags a test by its own marker and its class marker', () => {
		const tags = new Map([
			['ModuleNewsTests', ['live-data']],
			['ModuleNewsTests/testA', ['slow-network']],
		])
		const report = build(
			tree(
				suite('ModuleNewsTests', [
					testCase('testA()', 'Passed', 1),
					testCase('testB()', 'Passed', 1),
				]),
			),
			{tags},
		)

		const [a, b] = report.suites[0].tests
		assert.deepEqual(a.tags, ['live-data', 'slow-network'])
		assert.deepEqual(b.tags, ['live-data'])
	})

	it('leaves tags out of an untagged test', () => {
		const report = build(tree(suite('ModuleNewsTests', [testCase('testA()', 'Passed', 1)])), {
			tags: new Map(),
		})

		assert.equal(onlyTest(report).tags, undefined)
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

describe('readSimulatorOsVersion', () => {
	it('prefers the runtime the job chose, so every shard shares one environment', () => {
		assert.equal(readSimulatorOsVersion({SIMULATOR_OS: '27-0'}, [{osVersion: '27.0.1'}]), '27.0')
	})

	it("falls back to the bundle's device when the job chose none", () => {
		assert.equal(readSimulatorOsVersion({}, [{osVersion: '27.0'}]), '27.0')
	})

	it('gives nothing when neither is there', () => {
		assert.equal(readSimulatorOsVersion({SIMULATOR_OS: ''}, undefined), undefined)
	})
})

describe('readRunnerLoad', () => {
	const header = '{"cpuCount":3,"ramBytes":7516192768}'
	const sample = (t, cpuAvg, cpuMax, ram) => JSON.stringify({t, cpuAvg, cpuMax, ram})

	it('turns the samples into time series, each point after the first a delta', () => {
		const load = readRunnerLoad(
			[header, sample(1000, 12.345, 50, 40), sample(3000, 80, 99, 45)].join('\n'),
		)

		assert.deepEqual(load, {
			cpuCount: 3,
			ramBytes: 7516192768,
			cpuAvg: [
				[1000, 12.35],
				[2000, 80],
			],
			cpuMax: [
				[1000, 50],
				[2000, 99],
			],
			ram: [
				[1000, 40],
				[2000, 45],
			],
		})
	})

	it('folds a steady stretch into its last point, as flakiness.io does', () => {
		const load = readRunnerLoad(
			[
				header,
				sample(1000, 10, 10, 40),
				sample(2000, 11, 11, 40.2),
				sample(3000, 12, 12, 40.4),
			].join('\n'),
		)

		// The stretch keeps the value it settled at and the time it ended.
		assert.deepEqual(load.cpuAvg, [
			[1000, 10],
			[2000, 11],
		])
		assert.deepEqual(load.ram, [
			[1000, 40],
			[2000, 40.2],
		])
	})

	it('skips a line the job cut short', () => {
		const load = readRunnerLoad([header, sample(1000, 10, 10, 40), '{"t":20'].join('\n'))

		assert.deepEqual(load.cpuAvg, [[1000, 10]])
	})

	it('gives nothing without a header or any samples', () => {
		assert.equal(readRunnerLoad(''), undefined)
		assert.equal(readRunnerLoad(header), undefined)
	})
})

describe('parseTestTags', () => {
	it('reads a marker above a class and above a test method', () => {
		const source = [
			'import XCTest',
			'',
			'/// Tags: live-data',
			'class ModuleMapTests: UITestCase {',
			'\t/// Opens the map and searches.',
			'\t/// Tags: slow-network, search',
			'\t@MainActor',
			'\tfunc testSearch() throws {',
			'\t}',
			'',
			'\tfunc testUntagged() throws {}',
			'}',
		].join('\n')

		assert.deepEqual(
			parseTestTags([source]),
			new Map([
				['ModuleMapTests', ['live-data']],
				['ModuleMapTests/testSearch', ['slow-network', 'search']],
			]),
		)
	})

	it('drops a marker that something other than a comment or attribute separates from its declaration', () => {
		const source = [
			'class ModuleMapTests: UITestCase {',
			'\t/// Tags: orphan',
			'\tlet screen = MapScreen()',
			'\tfunc testA() {}',
			'}',
		].join('\n')

		assert.deepEqual(parseTestTags([source]), new Map())
	})
})
