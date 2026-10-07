/**
 * A node:test reporter that writes the run as a Flakiness report, for the
 * flakiness CLI to upload.
 *
 * CI adds it through NODE_OPTIONS beside the spec reporter. It writes no
 * output of its own beyond naming the file, and a local run never loads it.
 *
 * Node's JUnit reporter is not a way round this: it writes a test outside any
 * describe as a bare <testcase>, which @flakiness/junit-xml refuses.
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import {FLAKINESS_PROJECT} from './write-uitest-flakiness-report.mjs'

/** Where the report goes, apart from Jest's own `flakiness-report/`. */
export const OUTPUT_DIR = 'node-test-flakiness-report'

/** The message worth reading: an assertion's own, not node:test's wrapper. */
function errorMessage(error) {
	return error.cause?.message || error.message
}

function location(data, cwd) {
	return {file: path.relative(cwd, data.file), line: data.line, column: data.column}
}

function toTest(event, cwd) {
	const {data, receivedAt} = event
	const duration = Math.round(data.details.duration_ms ?? 0)
	const skipped = Boolean(data.skip || data.todo)
	const attempt = {
		environmentIdx: 0,
		expectedStatus: skipped ? 'skipped' : 'passed',
		status: event.type === 'test:fail' ? 'failed' : skipped ? 'skipped' : 'passed',
		// node:test reports when a test ends, not when it began.
		startTimestamp: receivedAt - duration,
		duration,
	}
	if (event.type === 'test:fail' && data.details.error) {
		attempt.errors = [{message: errorMessage(data.details.error)}]
	}

	return {title: data.name, location: location(data, cwd), attempts: [attempt]}
}

/** A suite holding `children`, split into the tests and suites the format wants. */
function toSuite(base, children) {
	const suite = {...base}
	const tests = children.filter((child) => child.attempts)
	const suites = children.filter((child) => !child.attempts)
	if (tests.length > 0) {
		suite.tests = tests
	}
	if (suites.length > 0) {
		suite.suites = suites
	}
	return suite
}

/**
 * Build the report from the `test:pass` and `test:fail` events, or null when
 * no test ran.
 *
 * node:test reports a test when it ends, so a describe block arrives after
 * everything in it: the events one level deeper that came since its last
 * sibling are its children. Each file keeps its own stack, since files run in
 * separate processes.
 */
export function buildReport(events, options) {
	const {cwd, commitId, url, nodeVersion, environment, startTimestamp, finishTimestamp} = options

	const files = new Map()
	for (const event of events) {
		const {data} = event
		const file = path.relative(cwd, data.file)
		if (!files.has(file)) {
			files.set(file, [])
		}
		const pending = files.get(file)

		const children = pending[data.nesting + 1] ?? []
		pending[data.nesting + 1] = []

		// A test with subtests becomes a suite, or the subtests would be lost.
		const node =
			data.details.type === 'suite' || children.length > 0
				? toSuite({type: 'suite', title: data.name, location: location(data, cwd)}, children)
				: toTest(event, cwd)
		pending[data.nesting] = [...(pending[data.nesting] ?? []), node]
	}

	if (files.size === 0) {
		return null
	}

	const report = {
		flakinessProject: FLAKINESS_PROJECT,
		category: 'node:test',
		commitId,
		testRunner: {name: 'node:test', version: nodeVersion},
		runtime: {name: 'node', version: nodeVersion},
		environments: [environment],
		suites: [...files].map(([file, pending]) =>
			toSuite({type: 'file', title: file}, pending[0] ?? []),
		),
		startTimestamp,
		duration: finishTimestamp - startTimestamp,
	}
	if (url) {
		report.url = url
	}
	return report
}

export default async function* flakinessReporter(source) {
	const startTimestamp = Date.now()
	const events = []
	for await (const event of source) {
		if (event.type === 'test:pass' || event.type === 'test:fail') {
			events.push({...event, receivedAt: Date.now()})
		}
	}

	const env = process.env
	const report = buildReport(events, {
		cwd: process.cwd(),
		commitId: env.GITHUB_SHA,
		url: env.GITHUB_RUN_ID
			? `${env.GITHUB_SERVER_URL}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`
			: undefined,
		nodeVersion: process.versions.node,
		environment: {
			name: 'node:test',
			systemData: {osName: os.type(), osVersion: os.release(), osArch: os.arch()},
		},
		startTimestamp,
		finishTimestamp: Date.now(),
	})
	if (!report) {
		return
	}

	try {
		fs.mkdirSync(OUTPUT_DIR, {recursive: true})
		fs.writeFileSync(path.join(OUTPUT_DIR, 'report.json'), JSON.stringify(report))
		yield `Wrote ${path.join(OUTPUT_DIR, 'report.json')}\n`
	} catch (error) {
		// Losing the report must not fail a run whose tests passed.
		yield `Could not write the flakiness report: ${error.message}\n`
	}
}
