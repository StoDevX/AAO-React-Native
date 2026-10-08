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
import {createHash} from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
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

/** The bundle's nodes that become annotations, by the annotation's type. */
const ANNOTATION_TYPES = {
	'Runtime Warning': 'runtime-warning',
	'Skip Message': 'skip',
	'Expected Failure': 'fail',
}

/** Each annotation the nodes hold, once: a warning can repeat many times. */
function toAnnotations(nodes) {
	const seen = new Set()
	return nodes.flatMap((node) => {
		const type = ANNOTATION_TYPES[node.nodeType]
		const key = `${type}\n${node.name}`
		if (!type || seen.has(key)) {
			return []
		}
		seen.add(key)
		return [{type, description: node.name}]
	})
}

/**
 * Find the `/// Tags: a, b` markers in the UI tests' Swift sources, keyed by
 * class (`ModuleMapTests`) or class and method (`ModuleMapTests/testSearch`).
 *
 * XCTest has no tags of its own. A marker belongs to the class or test
 * function it sits above; other comments and attributes may come between,
 * but anything else orphans it.
 */
export function parseTestTags(sources) {
	const tags = new Map()
	for (const source of sources) {
		let currentClass
		let pending
		for (const line of source.split('\n')) {
			const marker = line.match(/^\s*\/\/\/\s*Tags:\s*(.+)$/u)
			if (marker) {
				pending = marker[1]
					.split(',')
					.map((tag) => tag.trim())
					.filter(Boolean)
				continue
			}

			const classMatch = line.match(/^\s*(?:(?:final|public|open)\s+)*class\s+(\w+)/u)
			const funcMatch = line.match(/^\s*(?:(?:override|public)\s+)*func\s+(test\w*)/u)
			if (classMatch) {
				currentClass = classMatch[1]
				if (pending) {
					tags.set(currentClass, pending)
				}
			} else if (funcMatch && currentClass) {
				if (pending) {
					tags.set(`${currentClass}/${funcMatch[1]}`, pending)
				}
			} else if (/^\s*(?:\/\/|@|$)/u.test(line)) {
				continue
			}
			pending = undefined
		}
	}
	return tags
}

/**
 * Turn XCTest activities into steps. An activity records when it started but
 * not how long it took, so each lasts until the next one starts, and the last
 * until its parent ends.
 */
/** A screenshot as the report lists it; its file goes in `attachments/<id>`. */
function toAttachment(screenshot) {
	return {name: screenshot.name, contentType: screenshot.contentType, id: screenshot.id}
}

function toSteps(activities, endMs, screenshots, claimed) {
	// xcresulttool sometimes lists an activity with no title and nothing in it.
	const shown = activities.filter((activity) => activity.title || activity.childActivities?.length)
	return shown.map((activity, index) => {
		const startMs = activity.startTime * 1000
		// An activity can lack a start time; the next one that has one ends this.
		const next = shown.slice(index + 1).find((later) => Number.isFinite(later.startTime))
		const stepEndMs = next ? next.startTime * 1000 : endMs
		const step = {title: activity.title}
		if (Number.isFinite(startMs)) {
			step.duration = Math.max(0, Math.round(stepEndMs - startMs))
		}

		// An assertion's own activity has no type, and is the one that failed.
		if (activity.isAssociatedWithFailure && !activity.activityType) {
			step.error = {message: activity.title}
		}
		if (activity.childActivities?.length) {
			step.steps = toSteps(activity.childActivities, stepEndMs, screenshots, claimed)
		}

		// An activity lists the attachments of everything inside it too, so a
		// screenshot goes on the deepest step that holds it: the children,
		// handled first, have already claimed theirs.
		const own = screenshots.filter(
			(shot) =>
				!claimed.has(shot) &&
				activity.attachments?.some((attachment) => attachment.timestamp === shot.timestamp),
		)
		if (own.length > 0) {
			own.forEach((shot) => claimed.add(shot))
			step.attachments = own.map(toAttachment)
		}
		return step
	})
}

/**
 * A failure, located in the repository when its file is in the checkout:
 * xcresulttool gives the path the runner built from.
 */
function toError(failureMessage, workspace) {
	const error = {message: failureMessage.name}
	const {filePath, lineNumber} = failureMessage.sourceLocation ?? {}
	if (workspace && filePath?.startsWith(`${workspace}/`) && Number.isInteger(lineNumber)) {
		error.location = {file: filePath.slice(workspace.length + 1), line: lineNumber, column: 1}
	}
	return error
}

/**
 * Turn one test, or one of its repetitions, into a run attempt.
 *
 * Without activities, attempts are laid end to end on `context.clock`, since
 * the bundle records how long
 * each took but not when it started.
 */
function toAttempt(run, context, testLevelNodes, activities = [], screenshots = []) {
	const {clock, workspace} = context
	const duration = Math.round((run.durationInSeconds ?? 0) * 1000)
	// The first activity says when the attempt really began; without one,
	// attempts are laid end to end.
	const firstStart = activities[0]?.startTime
	const startTimestamp = Number.isFinite(firstStart) ? Math.round(firstStart * 1000) : clock.now
	const attempt = {
		environmentIdx: 0,
		expectedStatus: EXPECTED_STATUSES[run.result] ?? 'passed',
		// An unknown result is a failure, so a new kind of outcome shows up
		// rather than passing unseen.
		status: STATUSES[run.result] ?? 'failed',
		startTimestamp,
		duration,
	}

	const errors = (run.children ?? [])
		.filter((child) => child.nodeType === 'Failure Message')
		.map((child) => toError(child, workspace))
	if (errors.length > 0) {
		attempt.errors = errors
	}

	const claimed = new Set()
	if (activities.length > 0) {
		attempt.steps = toSteps(activities, startTimestamp + duration, screenshots, claimed)
	}
	const unclaimed = screenshots.filter((shot) => !claimed.has(shot))
	if (unclaimed.length > 0) {
		attempt.attachments = unclaimed.map(toAttachment)
	}

	const annotations = toAnnotations([...(run.children ?? []), ...testLevelNodes])
	if (annotations.length > 0) {
		attempt.annotations = annotations
	}

	clock.now += duration
	return attempt
}

/**
 * A test has one attempt per repetition, or one of its own when it never
 * retried. Its tags are its class's and its own.
 */
function toTest(testCase, suiteName, context) {
	const {tags, activities, screenshots} = context
	const repetitions = (testCase.children ?? []).filter((child) => child.nodeType === 'Repetition')
	const runs = repetitions.length > 0 ? repetitions : [testCase]
	// A retried test's own nodes, beside its repetitions, belong to every attempt.
	const testLevelNodes =
		repetitions.length > 0
			? (testCase.children ?? []).filter((child) => child.nodeType !== 'Repetition')
			: []
	const testScreenshots = screenshots.get(testCase.nodeIdentifier) ?? []
	// xcresulttool lists a test's activity runs one per attempt, in order.
	const activityRuns = activities.get(testCase.nodeIdentifier) ?? []
	const test = {
		title: testCase.name,
		attempts: runs.map((run, index) =>
			toAttempt(
				run,
				context,
				testLevelNodes,
				activityRuns[index],
				// xcresulttool numbers repetitions from 1.
				testScreenshots.filter((shot) => shot.repetition === index + 1),
			),
		),
	}

	const method = testCase.name.replace(/\(\)$/u, '')
	const testTags = [
		...new Set([...(tags.get(suiteName) ?? []), ...(tags.get(`${suiteName}/${method}`) ?? [])]),
	]
	if (testTags.length > 0) {
		test.tags = testTags
	}
	return test
}

/**
 * Turn the tree into suites. Plan and bundle nodes are walked through, since
 * every test in a shard shares them.
 */
function toSuites(nodes, context) {
	return (nodes ?? []).flatMap((node) => {
		if (node.nodeType === 'Test Case') {
			return []
		}

		const tests = (node.children ?? [])
			.filter((child) => child.nodeType === 'Test Case')
			.map((child) => toTest(child, node.name, context))
		const nested = toSuites(node.children, context)

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
 * Put every attempt in one lane of flakiness.io's test timeline. A lane is a
 * worker on one machine, and the timeline draws nothing for a report with no
 * attempt in lane 0.
 */
/** Every attempt in the suites, however deeply nested. */
function allAttempts(suites) {
	return suites.flatMap((suite) => [
		...(suite.tests ?? []).flatMap((test) => test.attempts),
		...allAttempts(suite.suites ?? []),
	])
}

function setLane(suites, parallelIndex) {
	for (const attempt of allAttempts(suites)) {
		attempt.parallelIndex = parallelIndex
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
		tags = new Map(),
		activities = new Map(),
		screenshots = new Map(),
		workspace,
	} = options

	const suites = toSuites(testNodes, {
		clock: {now: testsStartedMs},
		tags,
		activities,
		screenshots,
		workspace,
	})
	if (simulatorWait) {
		suites.unshift(simulatorWaitSuite(simulatorWait))
	}
	if (suites.length === 0) {
		return null
	}
	if (parallelIndex !== undefined) {
		setLane(suites, parallelIndex)
	}

	// The run spans its attempts, the simulator wait's among them.
	const attempts = allAttempts(suites)
	const startTimestamp = Math.min(...attempts.map((attempt) => attempt.startTimestamp))
	const endTimestamp = Math.max(
		...attempts.map((attempt) => attempt.startTimestamp + attempt.duration),
	)

	const report = {
		flakinessProject: FLAKINESS_PROJECT,
		category: 'xcuitest',
		title: `UITests (${shard})`,
		commitId,
		environments: [{name: 'iOS Simulator', systemData: {osName: 'iOS', osVersion}}],
		suites,
		startTimestamp,
		duration: endTimestamp - startTimestamp,
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

/** Every test case in the tree. */
function testCasesIn(nodes) {
	return (nodes ?? []).flatMap((node) =>
		node.nodeType === 'Test Case' ? [node] : testCasesIn(node.children),
	)
}

/**
 * Each test's activities, one list per attempt in the order they ran, keyed
 * by the test's identifier. A test whose activities cannot be read is left
 * out, and its attempts keep their end-to-end timing.
 */
function readActivities(bundlePath, testNodes) {
	const activities = new Map()
	let unreadable = 0
	for (const {nodeIdentifier} of testCasesIn(testNodes)) {
		if (!nodeIdentifier) {
			continue
		}
		try {
			const stdout = execFileSync(
				'xcrun',
				[
					'xcresulttool',
					'get',
					'test-results',
					'activities',
					'--test-id',
					nodeIdentifier,
					'--path',
					bundlePath,
				],
				{encoding: 'utf8', maxBuffer: 64 * 1024 * 1024},
			)
			const runs = (JSON.parse(stdout).testRuns ?? [])
				.map((run) => run.activities ?? [])
				.toSorted((a, b) => (a[0]?.startTime ?? 0) - (b[0]?.startTime ?? 0))
			activities.set(nodeIdentifier, runs)
		} catch {
			unreadable += 1
		}
	}
	if (unreadable > 0) {
		console.log(`Could not read the activities of ${unreadable} tests`)
	}
	return activities
}

/** Screenshot types, by file extension. Screen recordings are left out for size. */
const IMAGE_TYPES = {png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', heic: 'image/heic'}

/**
 * Export the bundle's screenshots: each test's, keyed by its identifier, and
 * the exported file behind each attachment id. The id is the file's SHA-1,
 * the name flakiness.io's report folder stores it under.
 */
function readScreenshots(bundlePath) {
	const screenshots = new Map()
	const files = new Map()
	try {
		const exportDir = fs.mkdtempSync(path.join(os.tmpdir(), 'uitest-attachments-'))
		execFileSync(
			'xcrun',
			['xcresulttool', 'export', 'attachments', '--path', bundlePath, '--output-path', exportDir],
			{
				stdio: 'ignore',
			},
		)
		const manifest = JSON.parse(fs.readFileSync(path.join(exportDir, 'manifest.json'), 'utf8'))
		for (const {testIdentifier, attachments = []} of manifest) {
			for (const attachment of attachments) {
				const contentType =
					IMAGE_TYPES[
						path
							.extname(attachment.exportedFileName ?? '')
							.slice(1)
							.toLowerCase()
					]
				if (!contentType) {
					continue
				}
				const filePath = path.join(exportDir, attachment.exportedFileName)
				const id = createHash('sha1').update(fs.readFileSync(filePath)).digest('hex')
				files.set(id, filePath)
				screenshots.set(testIdentifier, [
					...(screenshots.get(testIdentifier) ?? []),
					{
						repetition: attachment.repetitionNumber,
						timestamp: attachment.timestamp,
						name: attachment.suggestedHumanReadableName ?? attachment.exportedFileName,
						contentType,
						id,
					},
				])
			}
		}
	} catch (error) {
		console.log(`Could not export the screenshots: ${error.message}`)
	}
	return {screenshots, files}
}

/** The tag markers in the UI tests' sources, or none if they cannot be read. */
function readTestTags(directory) {
	try {
		const files = fs
			.readdirSync(directory, {recursive: true})
			.filter((file) => file.endsWith('.swift'))
		return parseTestTags(files.map((file) => fs.readFileSync(path.join(directory, file), 'utf8')))
	} catch (error) {
		console.log(`Could not read the tags in ${directory}: ${error.message}`)
		return new Map()
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
	const {screenshots, files} = readScreenshots(bundlePath)
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
		tags: readTestTags('uitests'),
		activities: readActivities(bundlePath, results.testNodes),
		workspace: env.GITHUB_WORKSPACE,
		screenshots,
		// Each shard runs on its own machine, one test at a time: one worker.
		parallelIndex: 0,
	})

	if (!report) {
		console.log('Nothing to report.')
		return
	}

	try {
		fs.mkdirSync(outputDir, {recursive: true})
		fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify(report))
		if (files.size > 0) {
			fs.mkdirSync(path.join(outputDir, 'attachments'), {recursive: true})
			for (const [id, filePath] of files) {
				fs.copyFileSync(filePath, path.join(outputDir, 'attachments', id))
			}
		}
		console.log(`Wrote ${path.join(outputDir, 'report.json')}`)
	} catch (error) {
		// Losing the report must not fail a shard whose tests passed.
		console.log(`Could not write the report: ${error.message}`)
	}
}

if (import.meta.main) {
	main()
}
