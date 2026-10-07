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

import {discoverTests, readTestDir} from './split-uitests.mjs'
import {FLAKINESS_PROJECT} from './write-uitest-flakiness-report.mjs'

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
		category: 'xcuitest',
		commitId,
		environments: [{name: 'iOS Simulator'}],
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

function readCachedTable(durationsPath) {
	try {
		return JSON.parse(fs.readFileSync(durationsPath, 'utf8'))
	} catch {
		return {}
	}
}

async function main() {
	const args = process.argv.slice(2)
	const valueOf = (flag) => {
		const index = args.indexOf(flag)
		return index === -1 ? null : args[index + 1]
	}

	const testDir = valueOf('--test-dir')
	const durationsPath = valueOf('--durations')
	const flakinessDir = valueOf('--flakiness')
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

		const cached = readCachedTable(durationsPath)
		fs.writeFileSync(durationsPath, JSON.stringify({...cached, ...predicted}))

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
