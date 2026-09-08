#!/usr/bin/env node

// Some packages have to appear exactly once in the lockfile. Metro is the
// reason this exists: it arrives from two directions, pinned by @expo/metro
// and floated by react-native, and for a while the install carried three
// copies of all fourteen metro packages. @expo/metro's is the one that bundles
// the app, so `pnpm-workspace.yaml` converges the rest onto it.
//
// Nothing fails when that slips — the bundle builds, the tests pass — so the
// duplication only shows up if someone goes looking at the lockfile. This
// makes it an error instead.

import fs from 'node:fs'
import path from 'node:path'
import {load} from 'js-yaml'
import {REPO_ROOT} from './paths.mjs'

const byName = (a, b) => a.localeCompare(b)

/**
 * Packages that must resolve to exactly one version, and why each is here.
 * Every entry needs a reason: this list is a set of decisions, not a
 * convention to apply to whatever happens to be duplicated today.
 */
const SINGLE_COPY = new Map([
	[
		'metro-config',
		'metro.config.js merges a config into whichever metro is bundling, so a second copy merges across two of them',
	],
	['metro-runtime', 'ships inside the bundle, so it has to be the metro that produced the bundle'],
	['metro-source-map', 'reads what metro-runtime writes, and the two travel together'],
	['metro-symbolicate', 'resolves a stack against metro-source-map, and the two travel together'],
])

/** `name@1.2.3` and `'@scope/name@1.2.3(peer@4)'` both yield their name and version. */
function parseKey(key) {
	let withoutPeers = key.split('(')[0]
	let at = withoutPeers.lastIndexOf('@')
	if (at <= 0) return null
	return {name: withoutPeers.slice(0, at), version: withoutPeers.slice(at + 1)}
}

let lockfilePath = path.join(REPO_ROOT, 'pnpm-lock.yaml')
let lockfile = load(fs.readFileSync(lockfilePath, 'utf-8'))

/** Every version each watched package resolved to. */
let versions = new Map()
for (let key of Object.keys(lockfile.packages ?? {})) {
	let parsed = parseKey(key)
	if (!parsed || !SINGLE_COPY.has(parsed.name)) continue

	if (!versions.has(parsed.name)) versions.set(parsed.name, new Set())
	versions.get(parsed.name).add(parsed.version)
}

/**
 * Who asked for a given version. The whole difficulty of a duplicate is
 * working out which dependent pulled the copy you did not expect, so the error
 * says so rather than leaving it to `pnpm why`.
 */
function dependentsOf(name, version) {
	let found = new Set()

	// A workspace package that declares it directly is named first, because
	// that is the one anybody reading this can actually change.
	for (let [importer, groups] of Object.entries(lockfile.importers ?? {})) {
		for (let group of Object.values(groups)) {
			let spec = group?.[name]
			if (spec && String(spec.version).split('(')[0] === version) {
				found.add(importer === '.' ? 'the workspace root' : importer)
			}
		}
	}

	for (let [key, snapshot] of Object.entries(lockfile.snapshots ?? {})) {
		for (let group of [snapshot.dependencies, snapshot.optionalDependencies]) {
			let resolved = group?.[name]
			if (resolved && resolved.split('(')[0] === version) {
				found.add(parseKey(key)?.name ?? key)
			}
		}
	}

	return [...found].sort(byName)
}

let failed = false

for (let [name, reason] of SINGLE_COPY) {
	let resolved = versions.get(name)

	if (!resolved) {
		console.log(`error: ${name} is watched for duplicates but is not in the lockfile`)
		console.log(`       Drop it from SINGLE_COPY in ${path.basename(import.meta.filename)}.`)
		failed = true
		continue
	}

	if (resolved.size === 1) continue

	console.log(`error: ${name} resolves to ${resolved.size} versions — ${reason}`)
	for (let version of [...resolved].sort(byName)) {
		let dependents = dependentsOf(name, version)
		let asked = dependents.length > 0 ? dependents.join(', ') : 'the workspace root'
		console.log(`  ${version} — wanted by ${asked}`)
	}
	failed = true
}

if (failed) {
	console.log('')
	console.log('Align the versions so each of these resolves once. A direct dependency')
	console.log('pinned in package.json is usually the one to move; where the split is')
	console.log('between two transitive dependents, an override in pnpm-workspace.yaml')
	console.log('can converge them.')
	process.exit(1)
}
