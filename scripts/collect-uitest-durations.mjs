/**
 * Read per-test durations out of an XCResult bundle, for the UI-test report
 * (`scripts/pr-report/uitest-report.mjs`).
 */

import {execFileSync} from 'node:child_process'

/**
 * Map every test that genuinely ran to the seconds it took.
 *
 * Only passing tests count. A skipped test reports a fraction of a second and a
 * failed one stops early, so either would read as a test that got faster, and
 * as one that beat its estimate. A retried test reports the mean of its
 * attempts, a failed one included, so its passing attempt's time is taken
 * instead.
 * @param {object[] | undefined} testNodes
 * @returns {Record<string, number>}
 */
export function collectDurations(testNodes) {
	const durations = {}

	const visit = (node) => {
		if (node.nodeType === 'Test Case') {
			const passingAttempt = node.children?.findLast(
				(child) => child.nodeType === 'Repetition' && child.result === 'Passed',
			)
			const seconds = (passingAttempt ?? node).durationInSeconds ?? 0
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
export function readTestNodes(bundlePath) {
	const stdout = execFileSync(
		'xcrun',
		['xcresulttool', 'get', 'test-results', 'tests', '--path', bundlePath],
		{encoding: 'utf8', maxBuffer: 64 * 1024 * 1024},
	)

	return JSON.parse(stdout).testNodes ?? []
}
