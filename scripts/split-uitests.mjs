#!/usr/bin/env node
/**
 * Discover XCTestCase classes and split them across N shards for CI.
 *
 * Emits a GitHub Actions matrix, so `uitest-plan` can hand each shard the
 * `-only-testing` flags that name its share of the suite.
 */

import fs from 'node:fs'
import path from 'node:path'

const CLASS_PATTERN = /class\s+(\w+)\s*:\s*(?:XCTestCase|UITestCase)/u
const METHOD_PATTERN = /func\s+(test\w+)\s*\(/gu

/**
 * Find the test classes in a set of Swift sources.
 *
 * Assumes one test class per file: every `func test…` in a file is
 * attributed to the first class matched there. A second class in the same
 * file would have its methods misattributed to the first, producing a
 * `-only-testing` identifier that does not exist.
 * @param {Array<{name: string, text: string}>} files
 * @returns {Array<{className: string, methods: string[]}>}
 */
export function discoverTests(files) {
	const classes = []
	for (const file of files) {
		const className = file.text.match(CLASS_PATTERN)?.[1]
		if (!className) {
			continue
		}

		const methods = [...file.text.matchAll(METHOD_PATTERN)].map((m) => m[1])
		if (methods.length > 0) {
			classes.push({className, methods})
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
 * test instead -- it takes the median, same as a test the table never saw.
 */
export function sanitizeDurations(durations) {
	return Object.fromEntries(Object.entries(durations).filter(([, value]) => Number.isFinite(value)))
}

/** The middle value, or 0 for an empty list. */
function median(numbers) {
	if (numbers.length === 0) {
		return 0
	}

	const sorted = [...numbers].sort((a, b) => a - b)
	const middle = Math.floor(sorted.length / 2)
	return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle]
}

/**
 * Weigh each class by how long its tests take.
 *
 * A test the table has never seen weighs the median of the ones it has, so a
 * newly added test does not read as free. With no table at all every test
 * weighs one, giving every test an equal share of the split.
 * @param {Array<{className: string, methods: string[]}>} classes
 * @param {Record<string, number>} durations
 * @returns {Array<{name: string, weight: number}>}
 */
export function weigh(classes, durations) {
	const known = Object.values(durations)
	const fallback = known.length === 0 ? 1 : median(known)

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
 * divide a class — only naming its methods individually can.
 * @param {Array<{className: string, methods: string[]}>} classes
 * @param {Record<string, number>} durations
 * @returns {Array<{name: string, weight: number}>}
 */
export function weighMethods(classes, durations) {
	const known = Object.values(durations)
	const fallback = known.length === 0 ? 1 : median(known)

	return classes.flatMap((testClass) =>
		testClass.methods.map((method) => ({
			name: `${testClass.className}/${method}`,
			weight: durations[`${testClass.className}/${method}()`] ?? fallback,
		})),
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

/** Render packed shards as the matrix object `fromJSON()` expects. */
export function formatMatrix(shards, target) {
	return {
		include: shards.map((shard, index) => ({
			shard: index + 1,
			tests: shard.map((item) => `-only-testing:${target}/${item.name}`).join(' '),
		})),
	}
}

/** Read every Swift file in a directory, in the order the planner packs them. */
function readTestDir(dir) {
	return fs
		.readdirSync(dir)
		.filter((name) => name.endsWith('.swift'))
		.sort()
		.map((name) => ({name, text: fs.readFileSync(path.join(dir, name), 'utf8')}))
}

function main() {
	const args = process.argv.slice(2)
	const valueOf = (flag, fallback) => {
		const index = args.indexOf(flag)
		return index === -1 ? fallback : args[index + 1]
	}

	const testDir = valueOf('--test-dir', null)
	const shardCount = Number(valueOf('--shards', '2'))
	const target = valueOf('--target', 'AllAboutOlafUITests')
	const granularity = valueOf('--granularity', 'class')

	if (!testDir || !fs.existsSync(testDir)) {
		console.error(`usage: split-uitests.mjs --test-dir <dir> [--shards N]`)
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

	const classes = discoverTests(readTestDir(testDir))
	if (classes.length === 0) {
		console.error(`Error: no test classes found in ${testDir}`)
		process.exit(1)
	}

	const items =
		granularity === 'method' ? weighMethods(classes, durations) : weigh(classes, durations)
	const shards = packShards(items, shardCount)

	const total = items.reduce((n, i) => n + i.weight, 0)
	console.error(
		`Found ${classes.length} test classes weighing ${total.toFixed(0)} units, ` +
			`splitting across ${shards.length} shards`,
	)
	for (const [index, shard] of shards.entries()) {
		const weight = shard.reduce((n, i) => n + i.weight, 0)
		console.error(
			`  Shard ${index + 1} (${weight.toFixed(0)} units): ` +
				`${shard.map((i) => i.name).join(', ')}`,
		)
	}

	console.log(JSON.stringify(formatMatrix(shards, target)))
}

if (import.meta.main) {
	main()
}
