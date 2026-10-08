#!/usr/bin/env node
/**
 * Discover XCTestCase classes and split them across N shards for CI.
 *
 * Emits a GitHub Actions matrix, so `uitest-plan` can hand each shard the
 * `-only-testing` flags that name its share of the suite.
 */

import fs from 'node:fs'
import path from 'node:path'

import {formatSeconds} from './pr-report/uitest-report.mjs'

const CLASS_PATTERN = /class\s+(\w+)\s*:\s*(?:XCTestCase|UITestCase)/gu
const METHOD_PATTERN = /func\s+(test\w+)\s*\(/gu

/**
 * Find the test classes in a set of Swift sources.
 *
 * A file may hold several test classes. Each `func test…` belongs to the
 * nearest class declared above it, which holds as long as test classes are
 * not nested inside one another.
 * @param {Array<{name: string, text: string}>} files
 * @returns {Array<{className: string, methods: string[]}>}
 */
export function discoverTests(files) {
	const classes = []
	for (const file of files) {
		const declarations = [...file.text.matchAll(CLASS_PATTERN)]
		for (const [index, declaration] of declarations.entries()) {
			const body = file.text.slice(declaration.index, declarations[index + 1]?.index)
			const methods = [...body.matchAll(METHOD_PATTERN)].map((m) => m[1])
			if (methods.length > 0) {
				classes.push({className: declaration[1], methods})
			}
		}
	}
	return classes
}

/**
 * Drop any duration that is not a finite number.
 *
 * A weight of NaN (or Infinity) propagates into `packShards`'s
 * `Math.min(...totals)` and turns every shard total NaN, so `indexOf` finds
 * none of them and the next push throws. A corrupt entry reads as an unknown
 * test instead -- it takes the p90, same as a test the table never saw.
 */
export function sanitizeDurations(durations) {
	return Object.fromEntries(Object.entries(durations).filter(([, value]) => Number.isFinite(value)))
}

/**
 * The 90th percentile by nearest rank, or 0 for an empty list.
 *
 * Nearest rank rather than an interpolated percentile, so the answer is always
 * a duration something actually took rather than a number between two of them.
 */
function p90(numbers) {
	if (numbers.length === 0) {
		return 0
	}

	const sorted = [...numbers].sort((a, b) => a - b)
	return sorted[Math.ceil(sorted.length * 0.9) - 1]
}

/**
 * Weigh each class by how long its tests take.
 *
 * A test the table has never seen weighs the p90 of the ones it has, so a
 * newly added test reads as slow rather than typical. The table is cached from
 * master, so a branch's own new tests are always the unknown ones -- weighing
 * them at the median let a branch adding slow tests underestimate its own
 * shard and discover the real numbers only after merging. With no table at all
 * every test weighs one, giving every test an equal share of the split.
 * @param {Array<{className: string, methods: string[]}>} classes
 * @param {Record<string, number>} durations
 * @returns {Array<{name: string, weight: number}>}
 */
export function weigh(classes, durations) {
	const known = Object.values(durations)
	const fallback = known.length === 0 ? 1 : p90(known)

	return classes.map((testClass) => ({
		name: testClass.className,
		weight: testClass.methods.reduce(
			(total, method) => total + (durations[`${testClass.className}/${method}()`] ?? fallback),
			0,
		),
	}))
}

/**
 * Weigh each test method on its own.
 *
 * A class can hold more of the suite than one shard's share, and no packing can
 * divide a class — only naming its methods individually can. A method the
 * table has no time for is `guessed`, so the plan can say which estimates
 * rest on no history.
 * @param {Array<{className: string, methods: string[]}>} classes
 * @param {Record<string, number>} durations
 * @returns {Array<{name: string, weight: number, guessed: boolean}>}
 */
export function weighMethods(classes, durations) {
	const known = Object.values(durations)
	const fallback = known.length === 0 ? 1 : p90(known)

	return classes.flatMap((testClass) =>
		testClass.methods.map((method) => {
			const seconds = durations[`${testClass.className}/${method}()`]
			return {
				name: `${testClass.className}/${method}`,
				weight: seconds ?? fallback,
				guessed: seconds === undefined,
			}
		}),
	)
}

/**
 * Distribute items across shards, heaviest first into the lightest shard.
 *
 * The classic LPT heuristic. Sorting descending first is what keeps one heavy
 * item from landing last and unbalancing everything.
 * @param {Array<{name: string, weight: number}>} items
 * @param {number} shardCount
 * @returns {Array<Array<{name: string, weight: number}>>}
 */
export function packShards(items, shardCount) {
	const count = Math.min(shardCount, items.length)
	const shards = Array.from({length: count}, () => [])
	const totals = Array.from({length: count}, () => 0)

	for (const item of [...items].sort((a, b) => b.weight - a.weight)) {
		const lightest = totals.indexOf(Math.min(...totals))
		shards[lightest].push(item)
		totals[lightest] += item.weight
	}

	return shards
}

const shardTotal = (shard) => shard.reduce((total, item) => total + item.weight, 0)

/**
 * The plan as the UI-test report reads it: each shard's estimate, keyed by its
 * matrix number, and each test's, keyed as the report keys a test's duration.
 * @param {Array<Array<{name: string, weight: number, guessed?: boolean}>>} shards
 */
export function buildPlan(shards) {
	const items = shards.flat()
	return {
		shards: Object.fromEntries(shards.map((shard, index) => [index + 1, shardTotal(shard)])),
		estimates: Object.fromEntries(items.map((item) => [`${item.name}()`, item.weight])),
		guessed: items.filter((item) => item.guessed).map((item) => `${item.name}()`),
	}
}

/**
 * The plan for the job log: each shard's estimate and its tests', longest
 * first, then the total and the shortest slowest shard any split could give.
 * That floor is an even share, or the longest test when it outlasts one.
 * @param {Array<Array<{name: string, weight: number, guessed?: boolean}>>} shards
 * @returns {string[]}
 */
export function describePlan(shards) {
	const items = shards.flat()
	const width = Math.max(...items.map((item) => formatSeconds(item.weight).length))
	const lines = shards.flatMap((shard, index) => [
		`Shard ${index + 1}: ${formatSeconds(shardTotal(shard))} estimated, ${shard.length} test${shard.length === 1 ? '' : 's'}`,
		...[...shard]
			.sort((a, b) => b.weight - a.weight)
			.map(
				(item) =>
					`  ${formatSeconds(item.weight).padStart(width)}  ${item.name}${item.guessed ? ' (guess: no history)' : ''}`,
			),
	])

	const total = shardTotal(items)
	const evenShare = total / shards.length
	const longest = Math.max(...items.map((item) => item.weight))
	const floor =
		longest > evenShare
			? `${formatSeconds(longest)} per shard, the longest test`
			: `${formatSeconds(evenShare)} per shard`
	lines.push(
		`Total ${formatSeconds(total)} across ${shards.length} shards; no split can beat ${floor}.`,
	)
	return lines
}

/** Render packed shards as the matrix object `fromJSON()` expects. */
export function formatMatrix(shards, target) {
	return {
		include: shards.map((shard, index) => ({
			shard: index + 1,
			tests: shard.map((item) => `-only-testing:${target}/${item.name}`).join(' '),
		})),
	}
}

/**
 * Read every Swift file under a directory, subfolders included, in the order
 * the planner packs them. Each file's name is its path relative to `dir`.
 * A subfolder named in `skipDirs` is left out, tests and all.
 */
export function readTestDir(dir, {skipDirs = []} = {}) {
	return (
		fs
			.readdirSync(dir, {recursive: true})
			.filter((name) => name.endsWith('.swift'))
			.filter((name) => !skipDirs.some((skip) => name.startsWith(skip + path.sep)))
			// By code unit, as a bare sort() would, so the packing order is the
			// same on every machine whatever its locale.
			.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
			.map((name) => ({name, text: fs.readFileSync(path.join(dir, name), 'utf8')}))
	)
}

/** The value after `flag` on a command line, or `fallback` when it is absent. */
export function flagValue(args, flag, fallback = null) {
	const index = args.indexOf(flag)
	return index === -1 ? fallback : args[index + 1]
}

function main() {
	const args = process.argv.slice(2)
	const valueOf = (flag, fallback) => flagValue(args, flag, fallback)

	const testDir = valueOf('--test-dir', null)
	const shardCount = Number(valueOf('--shards', '2'))
	const target = valueOf('--target', 'AllAboutAnythingUITests')
	const granularity = valueOf('--granularity', 'class')
	const skipDirs = args.flatMap((arg, index) => (args[index - 1] === '--skip-dir' ? [arg] : []))

	if (!testDir || !fs.existsSync(testDir)) {
		console.error(
			`usage: split-uitests.mjs --test-dir <dir> [--shards N] [--skip-dir <subdir>]... [--plan <out.json>]`,
		)
		process.exit(1)
	}

	// This table only tunes the balance of the shards; it must never be able to
	// fail the job. A truncated or corrupt cache entry falls back to an empty
	// table (equal weights) rather than throwing out of main().
	const durationsPath = valueOf('--durations', null)
	let durations = {}
	if (durationsPath && fs.existsSync(durationsPath)) {
		try {
			durations = sanitizeDurations(JSON.parse(fs.readFileSync(durationsPath, 'utf8')))
		} catch (error) {
			console.error(
				`Warning: could not read ${durationsPath}, packing with equal weights: ${error.message}`,
			)
			durations = {}
		}
	}

	const classes = discoverTests(readTestDir(testDir, {skipDirs}))
	if (classes.length === 0) {
		console.error(`Error: no test classes found in ${testDir}`)
		process.exit(1)
	}

	const items =
		granularity === 'method' ? weighMethods(classes, durations) : weigh(classes, durations)
	const shards = packShards(items, shardCount)

	console.error(`Found ${classes.length} test classes, splitting across ${shards.length} shards`)
	if (Object.keys(durations).length === 0) {
		console.error('No durations to go on: every test weighs one, so the times below are counts.')
	}
	for (const line of describePlan(shards)) {
		console.error(line)
	}

	const planPath = valueOf('--plan', null)
	if (planPath) {
		fs.writeFileSync(planPath, JSON.stringify(buildPlan(shards)))
	}

	console.log(JSON.stringify(formatMatrix(shards, target)))
}

if (import.meta.main) {
	main()
}
