#!/usr/bin/env node
/**
 * Decide whether a pull request's changes can reach the UITests at all.
 *
 * Three macOS shards is the most expensive thing a pull request does, and a
 * change to a Markdown file or a Jest test cannot alter what a UITest sees. The
 * rule is deliberately one-sided: only a change we are certain is inert lets
 * the suite be skipped, and anything unrecognised runs it.
 */

import path from 'node:path'

/**
 * Paths that cannot change what the app under test does.
 *
 * Everything absent from this list runs the suite, so a new kind of file is
 * safe by default and adding one here is a deliberate act.
 */
const INERT = [
	/^docs\//u,
	/\.md$/u,
	/^fastlane\//u,
	/(^|\/)__tests__\//u,
	/\.test\.tsx?$/u,
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

function main() {
	const changedFiles = process.argv.slice(2).filter(Boolean)
	const needed = uitestsNeeded(changedFiles)

	console.log(needed ? 'UITests are needed.' : 'No changed file can reach the UITests.')
	console.log(`needed=${needed}`)
}

// A literal `import.meta` here would fail Jest's CommonJS transform of this
// file, so the entry-point check goes by argv instead.
if (process.argv[1] && path.basename(process.argv[1]) === 'uitests-needed.mjs') {
	main()
}
