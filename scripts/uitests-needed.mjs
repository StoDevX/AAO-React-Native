#!/usr/bin/env node
/**
 * Decide whether a pull request's changes can reach the UITests at all.
 *
 * Three macOS shards is the most expensive thing a pull request does, and a
 * change to a Markdown file or a Jest test cannot alter what a UITest sees. The
 * rule is deliberately one-sided: only a change we are certain is inert lets
 * the suite be skipped, and anything unrecognised runs it.
 */

import {readFileSync} from 'node:fs'

/**
 * Paths that cannot change what the app under test does.
 *
 * Everything absent from this list runs the suite, so a new kind of file is
 * safe by default and adding one here is a deliberate act.
 */
const INERT = [
	/^docs\//u,
	/\.md$/u,
	/(^|\/)__tests__\//u,
	// A node:test file sits beside its subject rather than in __tests__/, so
	// the directory rule above never sees it.
	/\.test\.(mjs|tsx?)$/u,
	/^source\/testing\//u,
	/^source\/__mocks__\//u,
	/^\.vscode\//u,
	/^\.idea\//u,
	/^LICENSE/u,
	/^\.gitignore$/u,
	/^\.gitattributes$/u,
	/^\.editorconfig$/u,
	/^\.oxlintrc\.json$/u,
	/^\.oxfmtrc\.json$/u,
	/^\.prettierignore$/u,
	/^\.claude\//u,
	/^\.superpowers\//u,
	/^renovate\.json$/u,
	/^jest\.config\.js$/u,
	/^scripts\/jest-setup\.js$/u,
]

/**
 * Other workflows cannot affect this one, but this one obviously can.
 */
function isInertWorkflow(file) {
	return file.startsWith('.github/') && file !== '.github/workflows/ios.yml'
}

/**
 * `mise run bundle-data` compiles data/ into docs/, and the app imports that
 * output directly -- e.g. app/(settings)/Privacy.tsx renders docs/privacy.json,
 * compiled from data/privacy.md. So no pattern keyed on extension (`.md$`,
 * among others) may call a file under data/ inert. data/_schemas/ is the one
 * exception: only the validation scripts read it, never the app.
 */
function isInertData(file) {
	return file.startsWith('data/_schemas/')
}

/**
 * Whether the UITests have to run for this set of changed files.
 * @param {string[]} changedFiles
 * @returns {boolean}
 */
export function uitestsNeeded(changedFiles) {
	// An empty list means the diff could not be worked out, not that nothing
	// changed. Run everything.
	if (changedFiles.length === 0) {
		return true
	}

	return !changedFiles.every((file) =>
		file.startsWith('data/')
			? isInertData(file)
			: isInertWorkflow(file) || INERT.some((pattern) => pattern.test(file)),
	)
}

// A very large pull request's changed-file list can exceed a shell's ARG_MAX,
// so the file goes to this script as a path (one file per line) rather than
// as argv entries the caller would have to chunk.
function main() {
	const listPath = process.argv[2]
	const changedFiles = listPath ? readFileSync(listPath, 'utf8').split('\n').filter(Boolean) : []
	const needed = uitestsNeeded(changedFiles)

	// The message is not machine-readable, so it goes to stderr; stdout is
	// exactly one line, `needed=true` or `needed=false`, so the workflow can
	// use it as $GITHUB_OUTPUT verbatim without extracting it from anything.
	console.error(needed ? 'UITests are needed.' : 'No changed file can reach the UITests.')
	console.log(`needed=${needed}`)
}

if (import.meta.main) {
	main()
}
