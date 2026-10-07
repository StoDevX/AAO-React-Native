#!/usr/bin/env node
/**
 * Fill the UITest duration table with flakiness.io's predicted durations.
 *
 * The cached table holds one master run, and a test's time can double from one
 * run to the next, so shards packed from it come out uneven. flakiness.io
 * predicts each test's duration from master's whole history instead. A test it
 * has no prediction for keeps the cached figure.
 *
 * This only tunes the balance of the shards, so it must never fail the job: on
 * any error it leaves the table as it was.
 */

import fs from 'node:fs'
import {createRequire} from 'node:module'
import path from 'node:path'
import {pathToFileURL} from 'node:url'

import {discoverTests, flagValue, readTestDir, sanitizeDurations} from './split-uitests.mjs'
import {
	FLAKINESS_PROJECT,
	UITEST_CATEGORY,
	UITEST_ENVIRONMENT_NAME,
} from './write-uitest-flakiness-report.mjs'

/**
 * A report naming every test and holding no results, for flakiness.io to
 * attach predictions to.
 *
 * Tests are named as `write-uitest-flakiness-report.mjs` uploads them, since
 * flakiness.io matches a test by its suite and title.
 * @param {Array<{className: string, methods: string[]}>} classes
 * @param {{commitId: string, now?: number}} options
 */
export function buildDurationsRequest(classes, {commitId, now = Date.now()}) {
	return {
		flakinessProject: FLAKINESS_PROJECT,
		category: UITEST_CATEGORY,
		commitId,
		environments: [{name: UITEST_ENVIRONMENT_NAME}],
		suites: classes.map((testClass) => ({
			type: 'suite',
			title: testClass.className,
			tests: testClass.methods.map((method) => ({title: `${method}()`, attempts: []})),
		})),
		startTimestamp: now,
		duration: 0,
	}
}

/**
 * Turn flakiness.io's answer into the table `split-uitests.mjs` reads: seconds,
 * keyed `Class/testMethod()`.
 *
 * A test with no history comes back with no attempts and is left out.
 */
export function readPredictedDurations(report) {
	const durations = {}
	for (const suite of report.suites ?? []) {
		for (const test of suite.tests ?? []) {
			const milliseconds = test.attempts?.[0]?.duration
			if (Number.isFinite(milliseconds)) {
				durations[`${suite.title}/${test.title}`] = milliseconds / 1000
			}
		}
	}
	return durations
}

/**
 * Load `@flakiness/sdk` from the mise install of the flakiness CLI, which
 * depends on it, so the planner needs no `pnpm install`.
 */
function importSdk(flakinessDir) {
	const cli = fs.realpathSync(path.join(flakinessDir, 'node_modules', 'flakiness', 'package.json'))
	return import(pathToFileURL(createRequire(cli).resolve('@flakiness/sdk')).href)
}

/**
 * Read the cached table's text, keeping only well-formed entries. Anything but
 * a JSON object -- a truncated or corrupt cache entry -- reads as empty.
 */
export function parseCachedTable(text) {
	try {
		const table = JSON.parse(text)
		return table && typeof table === 'object' && !Array.isArray(table)
			? sanitizeDurations(table)
			: {}
	} catch {
		return {}
	}
}

function readCachedTable(durationsPath) {
	return fs.existsSync(durationsPath)
		? parseCachedTable(fs.readFileSync(durationsPath, 'utf8'))
		: {}
}

async function main() {
	const args = process.argv.slice(2)
	const testDir = flagValue(args, '--test-dir')
	const durationsPath = flagValue(args, '--durations')
	const flakinessDir = flagValue(args, '--flakiness')
	if (!testDir || !durationsPath || !flakinessDir) {
		console.error(
			'usage: fetch-uitest-durations.mjs --test-dir <dir> --durations <table> --flakiness <mise install dir>',
		)
		// A workflow that calls this wrongly is a bug in the workflow.
		process.exit(2)
	}

	// flakiness.io answers a commit ID that is not a SHA with no predictions at
	// all, rather than an error.
	const commitId = process.env.GITHUB_SHA
	if (!commitId) {
		console.log('GITHUB_SHA is unset, keeping the cached table')
		return
	}

	try {
		const {fetchTestDurations} = await importSdk(flakinessDir)
		const classes = discoverTests(readTestDir(testDir))
		const request = buildDurationsRequest(classes, {commitId})
		const predicted = readPredictedDurations(await fetchTestDurations(request))

		// Written beside the table and renamed over it, so a step timeout that
		// lands mid-write cannot leave the splitter a truncated table.
		const cached = readCachedTable(durationsPath)
		fs.writeFileSync(`${durationsPath}.tmp`, JSON.stringify({...cached, ...predicted}))
		fs.renameSync(`${durationsPath}.tmp`, durationsPath)

		const total = classes.reduce((n, testClass) => n + testClass.methods.length, 0)
		console.log(`flakiness.io predicted ${Object.keys(predicted).length} of ${total} tests`)
	} catch (error) {
		console.log(
			`Could not fetch durations from flakiness.io, keeping the cached table: ${error.message}`,
		)
	}
}

if (import.meta.main) {
	await main()
}
