#!/usr/bin/env node
/**
 * Write a shard's UITest results as a Flakiness report, for the flakiness
 * CLI to upload.
 *
 * `-retry-tests-on-failure` keeps one `Repetition` per attempt, and each
 * becomes its own attempt in the report, so flakiness.io sees a test that
 * passed on a retry as the flake it is. The simulator wait before the tests
 * is reported as a test of its own, `CI/waitForSimulator`, to keep its
 * timing beside theirs.
 *
 * The UI-test job installs no packages, so this imports nothing beyond Node
 * and the scripts beside it.
 */

import {execFileSync} from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

import {readTestResults} from './report-flaky-uitests.mjs'

/** The flakiness.io project these results belong to. */
export const FLAKINESS_PROJECT = 'frogpond/all-about-olaf'

const STATUSES = {
	Passed: 'passed',
	Failed: 'failed',
	Skipped: 'skipped',
	'Expected Failure': 'failed',
}

const EXPECTED_STATUSES = {
	Skipped: 'skipped',
	'Expected Failure': 'failed',
}

/**
 * Read the timing the "Wait for the simulator" step left in the environment.
 *
 * Gives nothing unless all three values are there and numeric: a job that
 * stopped before that step has no wait to report.
 */
export function readSimulatorWait(env) {
	const values = [
		env.SIMULATOR_WAIT_STARTED_MS,
		env.SIMULATOR_WAIT_DURATION_MS,
		env.SIMULATOR_WAIT_EXIT,
	]
	if (values.some((value) => value === undefined || value.trim() === '')) {
		return
	}

	const [startedMs, durationMs, exitCode] = values.map(Number)
	if (![startedMs, durationMs, exitCode].every(Number.isFinite)) {
		return
	}

	return {startedMs, durationMs, exitCode}
}

/**
 * The iOS version for the report's environment.
 *
 * flakiness.io merges shards only when their environments match, so the
 * runtime the job chose (`SIMULATOR_OS`, like `27-0`) comes first: a shard
 * whose simulator never came up has no bundle to read a device from.
 */
export function readSimulatorOsVersion(env, devices) {
	if (env.SIMULATOR_OS) {
		return env.SIMULATOR_OS.replaceAll('-', '.')
	}
	return devices?.[0]?.osVersion
}

/** How far a series may wander, in percent, before a new point is kept. */
const PRECISION = {cpuAvg: 7, cpuMax: 7, ram: 1}

/**
 * Add a point, folding a steady stretch into its last point the way
 * `@flakiness/sdk` does: when the last two points and the new one lie within
 * `precision` of each other, the last point moves to the new time.
 */
function addPoint(series, point, precision) {
	const last = series.at(-1)
	const beforeLast = series.at(-2)
	if (
		last &&
		beforeLast &&
		Math.abs(last.value - beforeLast.value) < precision &&
		Math.abs(last.value - point.value) < precision
	) {
		last.t = point.t
	} else {
		series.push(point)
	}
}

/** The report's form: the first point's time is absolute, the rest deltas. */
function toTelemetry(series) {
	return series.map((point, index) => [
		index === 0 ? point.t : point.t - series[index - 1].t,
		Math.round(point.value * 100) / 100,
	])
}

/**
 * Turn what `sample-runner-load.mjs` wrote into the report's CPU and memory
 * fields, or nothing without a header and at least one sample.
 */
export function readRunnerLoad(text) {
	const lines = text.split('\n').flatMap((line) => {
		try {
			return [JSON.parse(line)]
		} catch {
			// The job's end can cut the last line short.
			return []
		}
	})
	const [header, ...samples] = lines
	if (!header?.cpuCount || samples.length === 0) {
		return
	}

	const series = {cpuAvg: [], cpuMax: [], ram: []}
	for (const sample of samples) {
		for (const key of Object.keys(series)) {
			addPoint(series[key], {t: sample.t, value: sample[key]}, PRECISION[key])
		}
	}

	return {
		cpuCount: header.cpuCount,
		ramBytes: header.ramBytes,
		cpuAvg: toTelemetry(series.cpuAvg),
		cpuMax: toTelemetry(series.cpuMax),
		ram: toTelemetry(series.ram),
	}
}

/**
 * Turn one test, or one of its repetitions, into a run attempt.
 *
 * Attempts are laid end to end on `clock`, since the bundle records how long
 * each took but not when it started.
 */
function toAttempt(run, clock) {
	const duration = Math.round((run.durationInSeconds ?? 0) * 1000)
	const attempt = {
		environmentIdx: 0,
		expectedStatus: EXPECTED_STATUSES[run.result] ?? 'passed',
		// An unknown result is a failure, so a new kind of outcome shows up
		// rather than passing unseen.
		status: STATUSES[run.result] ?? 'failed',
		startTimestamp: clock.now,
		duration,
	}

	const errors = (run.children ?? [])
		.filter((child) => child.nodeType === 'Failure Message')
		.map((child) => ({message: child.name}))
	if (errors.length > 0) {
		attempt.errors = errors
	}

	clock.now += duration
	return attempt
}

/** A test has one attempt per repetition, or one of its own when it never retried. */
function toTest(testCase, clock) {
	const repetitions = (testCase.children ?? []).filter((child) => child.nodeType === 'Repetition')
	const runs = repetitions.length > 0 ? repetitions : [testCase]
	return {title: testCase.name, attempts: runs.map((run) => toAttempt(run, clock))}
}

/**
 * Turn the tree into suites. Plan and bundle nodes are walked through, since
 * every test in a shard shares them.
 */
function toSuites(nodes, clock) {
	return (nodes ?? []).flatMap((node) => {
		if (node.nodeType === 'Test Case') {
			return []
		}

		const tests = (node.children ?? [])
			.filter((child) => child.nodeType === 'Test Case')
			.map((child) => toTest(child, clock))
		const nested = toSuites(node.children, clock)

		if (node.nodeType !== 'Test Suite') {
			return nested
		}

		const suite = {type: 'suite', title: node.name}
		if (tests.length > 0) {
			suite.tests = tests
		}
		if (nested.length > 0) {
			suite.suites = nested
		}
		return [suite]
	})
}

/** The simulator wait, as a suite of one test. */
function simulatorWaitSuite(wait) {
	const attempt = {
		environmentIdx: 0,
		expectedStatus: 'passed',
		status: wait.exitCode === 0 ? 'passed' : 'failed',
		startTimestamp: wait.startedMs,
		duration: wait.durationMs,
	}
	if (wait.exitCode !== 0) {
		attempt.errors = [{message: `simctl bootstatus exited with code ${wait.exitCode}`}]
	}

	return {type: 'suite', title: 'CI', tests: [{title: 'waitForSimulator', attempts: [attempt]}]}
}

/**
 * Put every attempt in one lane of flakiness.io's waterfall. Shards run side
 * by side, so each is a lane, as a parallel worker would be.
 */
function setLane(suites, parallelIndex) {
	for (const suite of suites) {
		for (const test of suite.tests ?? []) {
			for (const attempt of test.attempts) {
				attempt.parallelIndex = parallelIndex
			}
		}
		setLane(suite.suites ?? [], parallelIndex)
	}
}

/**
 * Build the report for one shard, or null when there is nothing in it.
 */
export function buildReport(testNodes, options) {
	const {
		shard,
		commitId,
		url,
		osVersion,
		xcodeVersion,
		testsStartedMs,
		simulatorWait,
		parallelIndex,
		runnerLoad,
	} = options

	const clock = {now: testsStartedMs}
	const suites = toSuites(testNodes, clock)
	const hasTests = suites.length > 0
	if (simulatorWait) {
		suites.unshift(simulatorWaitSuite(simulatorWait))
	}
	if (suites.length === 0) {
		return null
	}
	if (parallelIndex !== undefined) {
		setLane(suites, parallelIndex)
	}

	const starts = [hasTests ? testsStartedMs : undefined, simulatorWait?.startedMs].filter(
		(ms) => ms !== undefined,
	)
	const ends = [
		hasTests ? clock.now : undefined,
		simulatorWait && simulatorWait.startedMs + simulatorWait.durationMs,
	].filter((ms) => ms !== undefined)
	const startTimestamp = Math.min(...starts)

	const report = {
		flakinessProject: FLAKINESS_PROJECT,
		category: 'xcuitest',
		title: `UITests (${shard})`,
		commitId,
		environments: [{name: 'iOS Simulator', systemData: {osName: 'iOS', osVersion}}],
		suites,
		startTimestamp,
		duration: Math.max(...ends) - startTimestamp,
		...runnerLoad,
	}
	if (url) {
		report.url = url
	}
	if (xcodeVersion) {
		report.testRunner = {name: 'xcodebuild', version: xcodeVersion}
	}
	return report
}

/** The Xcode version, as `xcodebuild -version` prints it, if it can be read. */
function readXcodeVersion() {
	try {
		return execFileSync('xcodebuild', ['-version'], {encoding: 'utf8'}).match(/^Xcode (\S+)/u)?.[1]
	} catch {
		return
	}
}

/** The runner's load, if the sampler left a file to read. */
function readRunnerLoadFile(filePath) {
	if (!filePath) {
		return
	}
	try {
		return readRunnerLoad(fs.readFileSync(filePath, 'utf8'))
	} catch (error) {
		console.log(`Could not read ${filePath}: ${error.message}`)
		return
	}
}

function main() {
	const [bundlePath, outputDir] = process.argv.slice(2)

	if (!bundlePath || !outputDir) {
		console.error('usage: write-uitest-flakiness-report.mjs <path to .xcresult> <output folder>')
		// A workflow that calls this wrongly is a bug in the workflow.
		process.exit(2)
	}

	let results = {}
	try {
		results = readTestResults(bundlePath)
	} catch (error) {
		// A shard whose simulator never came up has no bundle; its wait is
		// still worth reporting.
		console.log(`Could not read ${bundlePath}: ${error.message}`)
	}

	const env = process.env
	const report = buildReport(results.testNodes ?? [], {
		shard: env.SHARD ?? 'unknown',
		commitId: env.GITHUB_SHA,
		url: env.GITHUB_RUN_ID
			? `${env.GITHUB_SERVER_URL}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`
			: undefined,
		osVersion: readSimulatorOsVersion(env, results.devices),
		xcodeVersion: readXcodeVersion(),
		testsStartedMs: env.UITEST_STARTED ? Number(env.UITEST_STARTED) * 1000 : Date.now(),
		simulatorWait: readSimulatorWait(env),
		runnerLoad: readRunnerLoadFile(env.RUNNER_LOAD),
		// Shards are numbered from 1; lanes from 0.
		parallelIndex: Number.isInteger(Number(env.SHARD)) ? Number(env.SHARD) - 1 : undefined,
	})

	if (!report) {
		console.log('Nothing to report.')
		return
	}

	try {
		fs.mkdirSync(outputDir, {recursive: true})
		fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify(report))
		console.log(`Wrote ${path.join(outputDir, 'report.json')}`)
	} catch (error) {
		// Losing the report must not fail a shard whose tests passed.
		console.log(`Could not write the report: ${error.message}`)
	}
}

if (import.meta.main) {
	main()
}
