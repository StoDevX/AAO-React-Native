#!/usr/bin/env node
/**
 * Measure the production JS bundle for the pull request report.
 *
 * Bytes are grouped through the source map, so the report can say which
 * package or feature grew, not only that the bundle did.
 */

import {lstatSync, readdirSync, readFileSync, statSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'

import {
	combineSizes,
	installedSizes,
	nodeModulesBytes,
	packageKeyOfDir,
	parsePackages,
} from './deps.mjs'
import {REPORT_VERSION} from './report-version.mjs'

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

/**
 * Sums source-map-explorer's per-file bytes by group, and app code by
 * feature. `files` is the minified bundle's source map: its `[unmapped]` is
 * Metro's module wrappers, which `groupOf` already counts as `(runtime)`,
 * unlike the unminified bundle's, which is mostly indentation no package owns.
 */
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

const PNPM_PACKAGE_DIR = /\/\.pnpm\/([^/]+)\/node_modules\//u

/**
 * Sums source-map-explorer's per-file bytes by package version, keyed
 * `name@version`. The version is in the path of a pnpm-installed file; a
 * file outside `node_modules/.pnpm` belongs to no package version.
 */
export function bundledSizes(files) {
	let sizes = {}
	for (let [path, {size}] of Object.entries(files)) {
		let dir = path.match(PNPM_PACKAGE_DIR)
		let key = dir ? packageKeyOfDir(dir[1]) : null
		if (key !== null) {
			sizes[key] = (sizes[key] ?? 0) + size
		}
	}
	return sizes
}

/**
 * Bytes of every regular file under `dir`, or 0 when it does not exist.
 * Metro's images go here; the app ships them beside the bundle.
 */
export function directoryBytes(dir) {
	let stat
	try {
		stat = lstatSync(dir)
	} catch {
		return 0
	}
	if (stat.isFile()) {
		return stat.size
	}
	if (!stat.isDirectory()) {
		return 0
	}
	return readdirSync(dir).reduce((sum, name) => sum + directoryBytes(join(dir, name)), 0)
}

/** Builds `size-report.json` from the measured totals, source-map-explorer's output and the installed dependencies. */
export function buildReport({baseSha, hermesBytes, assetsBytes, explorer, deps}) {
	let {byPackage, byFeature} = groupBundle(explorer.results[0].files)
	return {
		version: REPORT_VERSION,
		baseSha,
		js: {hermesBytes, assetsBytes, byPackage, byFeature},
		deps,
	}
}

/**
 * Reads the bytecode and explorer output from `dir`, the lockfile and
 * `node_modules` from the working directory, and writes
 * `dir/size-report.json`. `baseSha` is the master commit this one was built
 * against (SIZE_REPORT_BASE_SHA), or null on a push to master.
 */
function main() {
	let dir = process.argv[2] ?? 'size-report'
	let baseSha = process.env.SIZE_REPORT_BASE_SHA || null
	let explorer = JSON.parse(readFileSync(`${dir}/explorer.json`, 'utf8'))
	let report = buildReport({
		baseSha,
		hermesBytes: statSync(`${dir}/main.hbc`).size,
		// The unminified export's --assets-dest; the minified one writes the same images.
		assetsBytes: directoryBytes(`${dir}/assets`),
		explorer,
		// Relative to the repo root, where the size-report task runs. `.pnpm`
		// is pnpm's isolated layout, which this repo uses; a hoisted linker
		// would have no such directory.
		deps: {
			nodeModulesBytes: nodeModulesBytes('node_modules/.pnpm'),
			packages: parsePackages(readFileSync('pnpm-lock.yaml', 'utf8')),
			sizes: combineSizes(
				installedSizes('node_modules/.pnpm'),
				bundledSizes(explorer.results[0].files),
			),
		},
	})
	writeFileSync(`${dir}/size-report.json`, `${JSON.stringify(report, null, '\t')}\n`)
	console.error(`Wrote ${dir}/size-report.json`)
}

if (import.meta.main) {
	main()
}
