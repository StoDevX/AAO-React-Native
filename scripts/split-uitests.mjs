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

	if (!testDir || !fs.existsSync(testDir)) {
		console.error(`usage: split-uitests.mjs --test-dir <dir> [--shards N]`)
		process.exit(1)
	}

	const classes = discoverTests(readTestDir(testDir))
	if (classes.length === 0) {
		console.error(`Error: no test classes found in ${testDir}`)
		process.exit(1)
	}

	const items = classes.map((c) => ({name: c.className, weight: c.methods.length}))
	const shards = packShards(items, shardCount)

	const total = items.reduce((n, i) => n + i.weight, 0)
	console.error(
		`Found ${classes.length} test classes with ${total} tests, ` +
			`splitting across ${shards.length} shards`,
	)
	for (const [index, shard] of shards.entries()) {
		const weight = shard.reduce((n, i) => n + i.weight, 0)
		console.error(`  Shard ${index + 1} (${weight} tests): ${shard.map((i) => i.name).join(', ')}`)
	}

	console.log(JSON.stringify(formatMatrix(shards, target)))
}

// A literal `import.meta` here would fail Jest's CommonJS transform of this
// file, so the entry-point check goes by argv instead.
if (process.argv[1] && path.basename(process.argv[1]) === 'split-uitests.mjs') {
	main()
}
