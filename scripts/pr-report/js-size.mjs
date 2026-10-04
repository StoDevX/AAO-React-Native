#!/usr/bin/env node
/**
 * Measure the production JS bundle for the pull request report.
 *
 * Bytes are grouped through the source map, so the report can say which
 * package or feature grew, not only that the bundle did.
 */

import {readFileSync, statSync, writeFileSync} from 'node:fs'

/** Bumped whenever the report's shape changes, so an older baseline is not misread. */
export const REPORT_VERSION = 2

const NODE_MODULES = '/node_modules/'

/**
 * Names the group a bundled file belongs to: its npm package, its workspace
 * module, the bundler's own runtime, or the app.
 *
 * pnpm nests every package as `.pnpm/<store-name>/node_modules/<name>`, and a
 * package can sit in another's node_modules, so the name follows the last
 * node_modules segment.
 */
export function groupOf(path) {
	let index = path.lastIndexOf(NODE_MODULES)
	if (index !== -1) {
		let [scope, name] = path.slice(index + NODE_MODULES.length).split('/')
		return scope.startsWith('@') ? `${scope}/${name}` : scope
	}
	// Metro's module wrappers and polyfills, which no source file owns.
	if (path.startsWith('[') || path.startsWith('../')) {
		return '(runtime)'
	}
	let module = path.match(/^\/modules\/([^/]+)\//u)
	if (module) {
		return `modules/${module[1]}`
	}
	return '(app)'
}

/** Names the `source/features/<name>` directory a file is in, or null. */
export function featureOf(path) {
	let feature = path.match(/^\/source\/features\/([^/]+)\//u)
	return feature ? feature[1] : null
}

/** Sums source-map-explorer's per-file bytes by group, and app code by feature. */
export function groupBundle(files) {
	let byPackage = {}
	let byFeature = {}
	for (let [path, {size}] of Object.entries(files)) {
		let group = groupOf(path)
		byPackage[group] = (byPackage[group] ?? 0) + size
		if (group === '(app)') {
			let feature = featureOf(path) ?? '(other)'
			byFeature[feature] = (byFeature[feature] ?? 0) + size
		}
	}
	return {byPackage, byFeature}
}

/** Builds `size-report.json` from the measured totals and source-map-explorer's output. */
export function buildReport({sha, baseSha, hermesBytes, explorer}) {
	let {byPackage, byFeature} = groupBundle(explorer.results[0].files)
	return {
		version: REPORT_VERSION,
		sha,
		baseSha,
		js: {hermesBytes, byPackage, byFeature},
	}
}

/**
 * Reads the bytecode and explorer output from `dir`, and writes
 * `dir/size-report.json`. The commit comes from SIZE_REPORT_SHA, which CI
 * sets; a run by hand records `local`. `baseSha` is the master commit this
 * one was built against (SIZE_REPORT_BASE_SHA), or null on a push to master.
 */
function main() {
	let dir = process.argv[2] ?? 'size-report'
	let sha = process.env.SIZE_REPORT_SHA || 'local'
	let baseSha = process.env.SIZE_REPORT_BASE_SHA || null
	let report = buildReport({
		sha,
		baseSha,
		hermesBytes: statSync(`${dir}/main.hbc`).size,
		explorer: JSON.parse(readFileSync(`${dir}/explorer.json`, 'utf8')),
	})
	writeFileSync(`${dir}/size-report.json`, `${JSON.stringify(report, null, '\t')}\n`)
	console.error(`Wrote ${dir}/size-report.json`)
}

if (import.meta.main) {
	main()
}
