#!/usr/bin/env node
/**
 * Check that nothing names a catalogued package's version for itself.
 *
 * The catalog exists because every module declares react and react-native as
 * peers, and autoInstallPeers turns each declaration into a real install: a
 * range that still matches the version being left behind keeps its old
 * resolution when the root pin moves, and the tree ends up with two runtimes.
 *
 * A `catalog:` reference cannot drift. A hardcoded range can, and one manifest
 * is enough to fork the tree again -- an override would converge it, but this
 * repository deliberately does not use one, because an override leaves every
 * manifest reading as though it decided something it did not.
 *
 * oxlint is asked about itself here too. Its config repeats the react version
 * for the linter's benefit, cannot say `catalog:`, and drifts in silence: the
 * only symptom is oxlint reasoning about a React we do not ship.
 */

import {execFileSync} from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import {load} from 'js-yaml'
import {MODULES_BASE, REPO_ROOT} from './paths.mjs'

const DEPENDENCY_BLOCKS = ['dependencies', 'devDependencies', 'peerDependencies']

const byName = (a, b) => a.localeCompare(b)

/**
 * Every place a manifest names a catalogued package with something other than
 * `catalog:`.
 */
export function findHardcodedRefs(manifests, catalogued) {
	let found = []

	for (let {path: file, json} of manifests) {
		for (let depType of DEPENDENCY_BLOCKS) {
			for (let [packageName, spec] of Object.entries(json[depType] ?? {})) {
				if (!catalogued.has(packageName) || spec === 'catalog:') continue

				found.push({path: file, depType, packageName, spec})
			}
		}
	}

	return found.sort((a, b) => byName(a.path, b.path) || byName(a.packageName, b.packageName))
}

/** Every workspace manifest, the root's included, with its repo-relative path. */
function readManifests() {
	let files = [path.join(REPO_ROOT, 'package.json')]

	for (let entry of fs.readdirSync(MODULES_BASE, {withFileTypes: true})) {
		if (!entry.isDirectory()) continue

		let file = path.join(MODULES_BASE, entry.name, 'package.json')
		if (fs.existsSync(file)) files.push(file)
	}

	return files.map((file) => ({
		path: path.relative(REPO_ROOT, file),
		json: JSON.parse(fs.readFileSync(file, 'utf-8')),
	}))
}

function readCatalog() {
	let workspace = load(fs.readFileSync(path.join(REPO_ROOT, 'pnpm-workspace.yaml'), 'utf-8'))

	return workspace.catalog ?? {}
}

/**
 * The react version oxlint is told to assume.
 *
 * Asked of oxlint rather than read out of `.oxlintrc.json`. The file is JSON
 * with comments, which `JSON.parse` refuses, and a pattern over the text is
 * guesswork -- it cannot see an `extends` or an `overrides` block, and would
 * answer confidently from the wrong place. `--print-config` is the resolved
 * configuration, which is the thing that actually decides which React APIs
 * oxlint believes in.
 */
function readLintReactVersion() {
	let stdout = execFileSync(
		path.join(REPO_ROOT, 'node_modules', '.bin', 'oxlint'),
		['--print-config'],
		{
			encoding: 'utf8',
			maxBuffer: 8 * 1024 * 1024,
		},
	)

	return JSON.parse(stdout).settings?.react?.version
}

let catalog = readCatalog()
let failed = false

for (let {path: file, depType, packageName, spec} of findHardcodedRefs(
	readManifests(),
	new Set(Object.keys(catalog)),
)) {
	console.log(`error: ${file} pins ${packageName} to ${spec} in ${depType}`)
	failed = true
}

let lintReactVersion = readLintReactVersion()
if (catalog.react && lintReactVersion !== catalog.react) {
	console.log(
		`error: .oxlintrc.json assumes react ${lintReactVersion ?? '(no version found)'}, but the catalog says ${catalog.react}`,
	)
	console.log('       oxlint decides which React APIs exist from that value.')
	failed = true
}

if (failed) {
	console.log('')
	console.log('A catalogued package is named once, in the catalog in pnpm-workspace.yaml.')
	console.log('Replace the version with "catalog:" and run `mise exec -- pnpm install`.')
	process.exit(1)
}
