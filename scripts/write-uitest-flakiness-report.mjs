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
 * Build the report for one shard, or null when there is nothing in it.
 */
export function buildReport(testNodes, options) {
	const {shard, commitId, url, osVersion, xcodeVersion, testsStartedMs, simulatorWait} = options

	const clock = {now: testsStartedMs}
	const suites = toSuites(testNodes, clock)
	const hasTests = suites.length > 0
	if (simulatorWait) {
		suites.unshift(simulatorWaitSuite(simulatorWait))
	}
	if (suites.length === 0) {
		return null
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
		osVersion: results.devices?.[0]?.osVersion,
		xcodeVersion: readXcodeVersion(),
		testsStartedMs: env.UITEST_STARTED ? Number(env.UITEST_STARTED) * 1000 : Date.now(),
		simulatorWait: readSimulatorWait(env),
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
