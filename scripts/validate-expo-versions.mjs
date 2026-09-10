#!/usr/bin/env node
/**
 * Check that our packages match the versions the installed Expo SDK expects.
 *
 * Expo builds and tests each SDK against one version of every package it knows
 * about, and drifting off that list is silent: the bundle builds, the tests
 * pass, and the mismatch surfaces as a native crash on a device. `expo
 * prebuild` mentions one such package in passing, which is easy to miss.
 *
 * The list read here is `expo/bundledNativeModules.json`, which ships inside
 * the `expo` package we have installed. That is deliberate. Expo's versions API
 * answers for the *newest* SDK patch, so a check built on it turns red when
 * Expo publishes -- master breaking on its own, with no commit behind it,
 * telling us to move onto versions the SDK we actually run has never been
 * tested against. Reading the installed SDK's own list means this can only
 * change when `package.json` does.
 *
 * Two things fall outside it, both on purpose. The SDK does not name its own
 * version, so whether `expo` is on the newest 57.x patch is not asked here --
 * that is a question about the outside world, and `renovate.json` holds `expo`
 * behind the dependency dashboard for a person to answer. `typescript` is not
 * in the list either.
 *
 * Deviating is sometimes right, so this does not forbid it. It requires that
 * each deviation be written down, and that a reason which has stopped applying
 * be taken out again.
 */

import fs from 'node:fs'
import path from 'node:path'
import semver from 'semver'
import {REPO_ROOT} from './paths.mjs'

/**
 * Packages we knowingly hold off the version the SDK expects, and why each one
 * is here. Every entry needs a reason: this list is a set of decisions, not a
 * place to park whatever happens to be mismatched today.
 */
export const EXPECTED_DEVIATIONS = new Map([
	[
		'@react-native-async-storage/async-storage',
		'on 3.x while the SDK expects 2.x, because 3.x is already shipped. Installed apps hold data written by it, and nothing here shows 2.x reads that back. The downgrade itself is cheap -- it costs only the jest mock its import path, since v2 ships jest/async-storage-mock while v3 exports a ./jest subpath and nothing else -- so it is the installed base, not the work, that keeps us here.',
	],
	[
		'@sentry/react-native',
		'on 8.x while the SDK expects 7.x: 7.11.0 has no Sentry.appLoaded(), which ends the app-start transaction in app/_layout.tsx, and no enableMetricKit option, which is where the iOS hang and crash diagnostics come from. Measured by downgrading -- both fail tsc.',
	],
	[
		'@expo/ui',
		'held at 57.0.14: from 57.0.15 it sets expoInternalSizeFromChildren on its iOS RNHostView, and the views under matchContents answer XCUITest with CGRectInfinite, failing four calendar UITests',
	],
])

const byName = (a, b) => a.localeCompare(b)

/**
 * Which installed packages fall outside the range the SDK recommends.
 *
 * A package the SDK knows about but we do not install is not our problem, so
 * `installed` decides what gets compared.
 */
export function findMismatches(recommended, installed) {
	let found = []

	for (let [packageName, expectedRange] of Object.entries(recommended)) {
		let actualVersion = installed[packageName]
		if (!actualVersion || semver.satisfies(actualVersion, expectedRange)) continue

		found.push({packageName, actualVersion, expectedRange})
	}

	return found.sort((a, b) => byName(a.packageName, b.packageName))
}

/**
 * Packages the SDK pins that Renovate could move without anyone approving it.
 *
 * Renovate has no idea what Expo recommends -- it only knows what is newest --
 * so left alone it will bump one of these past the range this SDK was tested
 * against. `renovate.json` holds them behind the dependency dashboard for a
 * person to decide, but that list is written by hand, so it stops covering a
 * package the day an SDK upgrade adds one.
 */
export function findUnheldPackages(recommended, declared, heldPatterns) {
	// Renovate's matchPackageNames takes a bare name or a trailing glob, and
	// treats * and ** the same way at the end of a pattern.
	let held = (name) =>
		heldPatterns.some((pattern) =>
			pattern.endsWith('*') ? name.startsWith(pattern.replace(/\*+$/u, '')) : pattern === name,
		)

	return declared.filter((name) => name in recommended && !held(name)).sort(byName)
}

/**
 * Sort the mismatches into the ones nobody has accounted for and the reasons
 * that no longer describe anything.
 */
export function reconcile(mismatches, deviations) {
	let mismatched = new Set(mismatches.map((each) => each.packageName))

	return {
		undeclared: mismatches
			.filter((each) => !deviations.has(each.packageName))
			.sort((a, b) => byName(a.packageName, b.packageName)),
		stale: [...deviations.keys()].filter((name) => !mismatched.has(name)).sort(byName),
	}
}

/** The version map the installed SDK ships. */
function readRecommended() {
	let file = path.join(REPO_ROOT, 'node_modules', 'expo', 'bundledNativeModules.json')

	if (!fs.existsSync(file)) {
		console.log('error: expo is not installed, so there is no version list to check against.')
		console.log('       Run `mise exec -- pnpm install` first.')
		process.exit(1)
	}

	return JSON.parse(fs.readFileSync(file, 'utf-8'))
}

/**
 * What each package we depend on actually resolved to.
 *
 * Read from the installed package rather than our own specifier, because a
 * `catalog:` reference names no version at all.
 */
function readInstalled(names) {
	let installed = {}

	for (let name of names) {
		let file = path.join(REPO_ROOT, 'node_modules', name, 'package.json')
		if (!fs.existsSync(file)) continue

		installed[name] = JSON.parse(fs.readFileSync(file, 'utf-8')).version
	}

	return installed
}

let scriptName = path.basename(import.meta.filename)
let manifest = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf-8'))
let declared = Object.keys({...manifest.dependencies, ...manifest.devDependencies})

/** Every package name held behind the dependency dashboard, however written. */
function readHeldPatterns() {
	let renovate = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'renovate.json'), 'utf-8'))

	return (renovate.packageRules ?? [])
		.filter((rule) => rule.dependencyDashboardApproval)
		.flatMap((rule) => rule.matchPackageNames ?? [])
}

let recommended = readRecommended()

let {undeclared, stale} = reconcile(
	findMismatches(recommended, readInstalled(declared)),
	EXPECTED_DEVIATIONS,
)

for (let {packageName, actualVersion, expectedRange} of undeclared) {
	console.log(`error: ${packageName} is ${actualVersion}, and this SDK expects ${expectedRange}`)
}

for (let name of stale) {
	console.log(`error: ${name} is listed as a deviation but does not deviate`)
	console.log(`       Drop it from EXPECTED_DEVIATIONS in ${scriptName}.`)
}

let unheld = findUnheldPackages(recommended, declared, readHeldPatterns())

for (let name of unheld) {
	console.log(`error: ${name} is pinned by this SDK, but renovate.json lets it move unapproved`)
}

if (unheld.length > 0) {
	console.log('')
	console.log('Renovate does not know what Expo recommends, only what is newest, so')
	console.log('a bump it opens unasked can leave the range this SDK was tested against.')
	console.log('Add these to the dependencyDashboardApproval rule in renovate.json.')
	console.log('')
}

if (undeclared.length > 0 || stale.length > 0 || unheld.length > 0) {
	if (undeclared.length > 0) {
		console.log('')
		console.log('Move these into the range named: that is what this SDK is built and tested')
		console.log('against. A package that has to stay where it is goes in')
		console.log(`EXPECTED_DEVIATIONS in ${scriptName}, with the reason.`)
	}

	process.exit(1)
}
