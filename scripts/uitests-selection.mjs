#!/usr/bin/env node
/**
 * Decide which UI-test classes a pull request's changes can reach.
 *
 * Each changed file under app/, source/ or modules/ is walked back through
 * its importers to the route files under app/, and a class runs when its
 * `/// Routes:` marker matches one of their routes. Anything in doubt runs
 * every class: the merge queue and master always do, so a class this skips
 * wrongly is still run before the change lands.
 */

import {execFileSync} from 'node:child_process'
import {readFileSync} from 'node:fs'

import {appFilesReaching, buildImporters} from './import-graph.mjs'
import {discoverTests} from './split-uitests.mjs'
import {isInert} from './uitests-needed.mjs'

/** Route files every UI test launches through: the root layout, Home, and the link handler. */
const EVERY_TEST = new Set(['app/_layout.tsx', 'app/index.tsx', 'app/+native-intent.ts'])

/**
 * A route file's path as a route: `app/menus/index.tsx` is `/menus`.
 * @param {string} file
 * @returns {string}
 */
export function routeOfFile(file) {
	const route = file
		.replace(/^app/u, '')
		.replace(/\.[jt]sx?$/u, '')
		.replace(/\/index$/u, '')
	return route === '' ? '/' : route
}

/** A pattern segment as a regular expression: `*` is any run within the segment. */
function segmentPattern(segment) {
	const escaped = segment.replaceAll(/[.+?^${}()|[\]\\]/gu, '\\$&').replaceAll('*', '[^/]*')
	return new RegExp(`^${escaped}$`, 'u')
}

/**
 * Whether a marker's pattern covers a route: the route itself or anything under it.
 * @param {string} pattern
 * @param {string} route
 * @returns {boolean}
 */
export function routeMatches(pattern, route) {
	const wanted = pattern.split('/')
	const parts = route.split('/')
	return (
		parts.length >= wanted.length &&
		wanted.every((segment, index) => segmentPattern(segment).test(parts[index]))
	)
}

/**
 * The `/// Routes: /a /b` marker above each test class. As with `/// Tags:`,
 * other comments and attributes may sit between it and the class; any other
 * line orphans it.
 * @param {Array<{name: string, text: string}>} files
 * @returns {Map<string, string[]>}
 */
export function parseRouteMarkers(files) {
	const markers = new Map()
	for (const file of files) {
		let pending = null
		for (const line of file.text.split('\n')) {
			const marker = line.match(/^\s*\/\/\/\s*Routes:\s*(.+)$/u)
			const declaration = line.match(/^\s*(?:final\s+)?class\s+(\w+)\s*:/u)
			if (marker) {
				pending = marker[1].trim().split(/\s+/u)
			} else if (declaration) {
				if (pending) markers.set(declaration[1], pending)
				pending = null
			} else if (!/^\s*(\/\/|@)/u.test(line)) {
				pending = null
			}
		}
	}
	return markers
}

/** The types a Swift file declares. */
function declaredTypes(text) {
	return [...text.matchAll(/\b(?:struct|class|enum|protocol)\s+(\w+)/gu)].map((match) => match[1])
}

/** The answer when any doubt means running every class. */
function everything(reason) {
	return {all: true, reason}
}

/**
 * Which UI-test classes can see this set of changes.
 * @param {{changedFiles: string[], tree: {list(): string[], read(path: string): string}}} input
 * @returns {{all: true, reason: string} | {all: false, classes: Map<string, string[]>}}
 */
export function selectUITests({changedFiles, tree}) {
	if (changedFiles.length === 0) return everything('the changed-file list is empty')

	const files = tree.list()
	const testFiles = files
		.filter(
			(file) =>
				file.startsWith('uitests/') &&
				file.endsWith('.swift') &&
				!file.startsWith('uitests/Chaos/'),
		)
		.map((name) => ({name, text: tree.read(name)}))
		.map((file) => ({...file, classes: discoverTests([file]).map((found) => found.className)}))
		.filter((file) => file.classes.length > 0)
	const allClasses = testFiles.flatMap((file) => file.classes)
	const markers = parseRouteMarkers(testFiles)

	const routes = files.filter((file) => file.startsWith('app/')).map(routeOfFile)
	for (const [className, patterns] of markers) {
		for (const pattern of patterns) {
			if (!routes.some((route) => routeMatches(pattern, route))) {
				throw new Error(`Routes marker ${pattern} on ${className} matches no route under app/`)
			}
		}
	}

	const selected = new Map()
	const add = (className, reason) => {
		if (!selected.has(className)) selected.set(className, [])
		selected.get(className).push(reason)
	}

	let importers = null
	let anyVisible = false
	for (const file of changedFiles) {
		if (isInert(file)) continue
		anyVisible = true

		if (file.startsWith('uitests/')) {
			const own = testFiles.find((testFile) => testFile.name === file)
			if (own) {
				for (const className of own.classes) add(className, `${file} changed`)
				continue
			}
			if (file.startsWith('uitests/Screens/') && files.includes(file)) {
				const types = declaredTypes(tree.read(file))
				const users = testFiles.filter((testFile) =>
					types.some((type) => new RegExp(`\\b${type}\\b`, 'u').test(testFile.text)),
				)
				if (users.length > 0) {
					for (const className of users.flatMap((user) => user.classes)) {
						add(className, `${file} changed`)
					}
					continue
				}
			}
			return everything(`${file} is shared by the UI tests`)
		}

		if (!/^(app|source|modules)\//u.test(file)) {
			return everything(`${file} is outside app/, source/ and modules/`)
		}

		importers ??= buildImporters(tree)
		const reached = appFilesReaching(file, importers)
		const root = [...reached].find((appFile) => EVERY_TEST.has(appFile))
		if (root) return everything(`${file} reaches ${root}`)
		if (reached.size === 0) return everything(`${file} reaches no route`)

		const reachedRoutes = [...reached].map(routeOfFile)
		for (const className of allClasses) {
			const hit = markers
				.get(className)
				?.find((pattern) => reachedRoutes.some((route) => routeMatches(pattern, route)))
			if (hit) add(className, `${file} reaches ${hit}`)
		}
	}

	if (anyVisible) {
		for (const className of allClasses) {
			if (!markers.has(className)) add(className, 'it has no Routes marker')
		}
	}
	return {all: false, classes: selected}
}

/** The checked-out repository, as the tree selectUITests reads. */
function workingTree() {
	const files = execFileSync('git', ['ls-files'], {encoding: 'utf8'}).split('\n').filter(Boolean)
	return {list: () => files, read: (path) => readFileSync(path, 'utf8')}
}

// The changed files come in as a path, one per line, because a large pull
// request's list can exceed ARG_MAX. stdout is exactly two lines for
// $GITHUB_OUTPUT; everything a person reads goes to stderr.
function main() {
	const listPath = process.argv[2]
	const changedFiles = listPath ? readFileSync(listPath, 'utf8').split('\n').filter(Boolean) : []
	const result = selectUITests({changedFiles, tree: workingTree()})

	if (result.all) {
		console.error(`Running every UI-test class: ${result.reason}.`)
		console.log('needed=true')
		console.log('only=')
		return
	}
	if (result.classes.size === 0) {
		console.error('No changed file can reach the UI tests.')
	}
	for (const [className, reasons] of result.classes) {
		console.error(`${className}: ${reasons.join('; ')}`)
	}
	console.log(`needed=${result.classes.size > 0}`)
	console.log(`only=${[...result.classes.keys()].join(' ')}`)
}

if (import.meta.main) {
	main()
}
