#!/usr/bin/env node
/**
 * Write a table of per-test durations from an XCResult bundle.
 *
 * `scripts/split-uitests.mjs` packs shards by test count, which is not the same
 * as time: one test has been seen to take two minutes where the median is
 * nearer ten seconds. This is where the real figures come from.
 */

import {execFileSync} from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Map every test that genuinely ran to the seconds it took.
 *
 * Only passing tests count. A skipped test reports a fraction of a second and a
 * failed one stops early, so either would drag its class's weight down and
 * unbalance the next run's shards.
 * @param {object[] | undefined} testNodes
 * @returns {Record<string, number>}
 */
export function collectDurations(testNodes) {
	const durations = {}

	const visit = (node) => {
		if (node.nodeType === 'Test Case') {
			const seconds = node.durationInSeconds ?? 0
			if (node.result === 'Passed' && seconds > 0) {
				durations[node.nodeIdentifier ?? node.name] = seconds
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

	return durations
}

/**
 * Ask xcresulttool for the test tree.
 *
 * The bundle holds every attempt of every test, so the JSON outgrows the
 * default 1 MB pipe buffer on a full shard.
 * @returns {object[]}
 */
function readTestNodes(bundlePath) {
	const stdout = execFileSync(
		'xcrun',
		['xcresulttool', 'get', 'test-results', 'tests', '--path', bundlePath],
		{encoding: 'utf8', maxBuffer: 64 * 1024 * 1024},
	)

	return JSON.parse(stdout).testNodes ?? []
}

function main() {
	const [bundlePath, outputPath] = process.argv.slice(2)

	if (!bundlePath || !outputPath) {
		console.error('usage: collect-uitest-durations.mjs <path to .xcresult> <output.json>')
		process.exit(2)
	}

	let durations = {}
	try {
		durations = collectDurations(readTestNodes(bundlePath))
	} catch (error) {
		// A step that times out leaves no bundle. Losing a run's timings costs
		// the next run some balance; failing the shard costs it everything.
		console.log(`Could not read ${bundlePath}: ${error.message}`)
	}

	fs.writeFileSync(outputPath, `${JSON.stringify(durations, null, '\t')}\n`)
	console.log(`Recorded ${Object.keys(durations).length} test durations`)
}

// A literal `import.meta` here would fail Jest's CommonJS transform of this
// file, so the entry-point check goes by argv instead.
if (process.argv[1] && path.basename(process.argv[1]) === 'collect-uitest-durations.mjs') {
	main()
}
