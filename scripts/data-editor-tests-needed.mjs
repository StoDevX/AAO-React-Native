#!/usr/bin/env node
/**
 * Decide whether a pull request's changes can reach the Mac data editor.
 *
 * The editor's tests take a macOS runner, and most pull requests touch only
 * the phone app or the data. The rule is the reverse of the UI-test gate's:
 * the editor reads few files, so those are listed and anything else skips.
 * The test beside this file builds the helper's bundle and fails when the
 * bundle reads a file this list misses.
 */

import {readFileSync} from 'node:fs'

/** Paths the editor, its helper or its toolchain read. */
const INPUTS = [
	/^macos\/DataEditor\//u,
	/^modules\/schedules\//u,
	/^scripts\/(data-editor|bundle-data|bundle-images|build-data-editor-helper|build-faqs|build-sources|convert-data-file|data-entries|data-problems|junk|make-images|paths|schedule-data|validate-schedules)/u,
	/^mise\.lock$/u,
	/^package\.json$/u,
	/^pnpm-lock\.yaml$/u,
	/^\.github\/workflows\/data-editor\.yml$/u,
]

/**
 * Whether the data editor's tests have to run for this set of changed files.
 * @param {string[]} changedFiles
 * @returns {boolean}
 */
export function dataEditorTestsNeeded(changedFiles) {
	// An empty list means the diff could not be worked out, not that nothing
	// changed. Run everything.
	if (changedFiles.length === 0) {
		return true
	}

	return changedFiles.some((file) => INPUTS.some((pattern) => pattern.test(file)))
}

// The list goes to this script as a path, one file per line, for the same
// reason as uitests-needed.mjs: a large pull request's list can exceed ARG_MAX.
function main() {
	const listPath = process.argv[2]
	const changedFiles = listPath ? readFileSync(listPath, 'utf8').split('\n').filter(Boolean) : []
	const needed = dataEditorTestsNeeded(changedFiles)

	console.error(
		needed ? 'The data editor tests are needed.' : 'No changed file can reach the data editor.',
	)
	console.log(`needed=${needed}`)
}

if (import.meta.main) {
	main()
}
