#!/usr/bin/env node
/**
 * Report the UITests that failed and then passed on a retry.
 *
 * `-retry-tests-on-failure` turns a flaky shard green, which also takes away
 * the signal that it flaked: the failure artifacts upload only `if: failure()`.
 * A retried test keeps one `Repetition` child per attempt in the result bundle,
 * so a test that passed with a failed attempt behind it is exactly a flake.
 */

import {execFileSync} from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Find the tests a retry rescued.
 *
 * A test that never flaked has no `Repetition` children at all, so their
 * presence alongside a passing result is the whole rule.
 */
export function findFlakyTests(testNodes) {
	const flaky = []

	const visit = (node) => {
		if (node.nodeType === 'Test Case') {
			const repetitions = (node.children ?? []).filter(
				(child) => child.nodeType === 'Repetition',
			)
			const failed = repetitions.filter((rep) => rep.result === 'Failed')

			if (node.result === 'Passed' && failed.length > 0) {
				flaky.push({
					identifier: node.nodeIdentifier ?? node.name,
					attempts: repetitions.length,
				})
			}

			// A Test Case's children are its attempts, never more test cases.
			return
		}

		for (const child of node.children ?? []) {
			visit(child)
		}
	}

	for (const node of testNodes ?? []) {
		visit(node)
	}

	return flaky
}

/**
 * Render the flakes as a warning per test plus a table for the job summary.
 *
 * Annotations rather than plain logs, because a green run's log is not read.
 * @param {Array<{identifier: string, attempts: number}>} flaky
 * @returns {{annotations: string[], summary: string}}
 */
export function formatReport(flaky) {
	if (flaky.length === 0) {
		return {annotations: [], summary: ''}
	}

	const annotations = flaky.map(
		(test) =>
			`::warning title=Flaky UITest::${test.identifier} passed only after a retry (${test.attempts} attempts)`,
	)

	const count = `${flaky.length} test${flaky.length === 1 ? '' : 's'}`
	const summary = [
		`### ⚠️ ${count} passed only after a retry`,
		'',
		'| Test | Attempts |',
		'| --- | --- |',
		...flaky.map((test) => `| \`${test.identifier}\` | ${test.attempts} |`),
		'',
	].join('\n')

	return {annotations, summary}
}

/**
 * Ask xcresulttool for the test tree.
 *
 * The bundle holds every attempt of every test, so the JSON outgrows the
 * default 1 MB pipe buffer on a full shard.
 */
function readTestNodes(bundlePath) {
	const stdout = execFileSync(
		'xcrun',
		['xcresulttool', 'get', 'test-results', 'tests', '--path', bundlePath],
		{encoding: 'utf8', maxBuffer: 64 * 1024 * 1024},
	)

	return JSON.parse(stdout).testNodes ?? []
}

/** Append a line to one of the files GitHub hands us through the environment. */
function appendTo(variable, text) {
	const file = process.env[variable]
	if (!file || !text) {
		return
	}

	fs.appendFileSync(file, `${text}\n`)
}

function main() {
	const bundlePath = process.argv[2]

	if (!bundlePath) {
		console.error('usage: report-flaky-uitests.mjs <path to .xcresult>')
		// The one loud failure: a workflow that calls this wrongly is a bug in
		// the workflow, and it would be wrong to report "nothing flaked".
		process.exit(2)
	}

	let flaky = []
	try {
		flaky = findFlakyTests(readTestNodes(bundlePath))
	} catch (error) {
		// A step that times out leaves no bundle. Losing the report is a smaller
		// problem than a shard that fails because its reporting failed.
		console.log(`Could not read ${bundlePath}: ${error.message}`)
		return
	}

	const {annotations, summary} = formatReport(flaky)
	try {
		for (const annotation of annotations) {
			console.log(annotation)
		}

		appendTo('GITHUB_STEP_SUMMARY', summary)
		appendTo('GITHUB_OUTPUT', `flaky=${flaky.length > 0}`)
	} catch (error) {
		// A full disk, an unwritable summary path, or a broken stdout pipe must
		// not fail a shard whose tests all passed.
		console.log(`Could not report the results: ${error.message}`)
	}

	if (flaky.length === 0) {
		console.log('No test needed a retry.')
	}
}

// A literal `import.meta` in this file would fail Jest's CommonJS transform
// of it, so the entry-point check goes by argv instead.
if (
	process.argv[1] &&
	path.basename(process.argv[1]) === 'report-flaky-uitests.mjs'
) {
	main()
}
