import assert from 'node:assert/strict'
import {readdirSync, readFileSync} from 'node:fs'
import {join} from 'node:path'
import {describe, it} from 'node:test'

import {
	discoverTests,
	packShards,
	formatMatrix,
	sanitizeDurations,
	weigh,
	weighMethods,
} from './split-uitests.mjs'

function swiftFile(name, text) {
	return {name, text}
}

/** Every `uitests/Module*Tests.swift`, in the order the planner reads them. */
function realTestFiles() {
	const dir = join(import.meta.dirname, '..', 'uitests')
	return readdirSync(dir)
		.filter((name) => name.endsWith('.swift'))
		.sort()
		.map((name) => swiftFile(name, readFileSync(join(dir, name), 'utf8')))
}

describe('discoverTests', () => {
	it('finds a class and its test methods', () => {
		assert.deepEqual(
			discoverTests([
				swiftFile(
					'ModuleThingTests.swift',
					'class ModuleThingTests: UITestCase {\n' +
						'\tfunc testOne() throws {}\n' +
						'\tfunc testTwo() throws {}\n' +
						'\tfunc helperNotATest() {}\n' +
						'}\n',
				),
			]),
			[{className: 'ModuleThingTests', methods: ['testOne', 'testTwo']}],
		)
	})

	it('accepts XCTestCase as well as UITestCase', () => {
		assert.deepEqual(
			discoverTests([
				swiftFile(
					'ModuleBareTests.swift',
					'class ModuleBareTests: XCTestCase {\n\tfunc testOne() throws {}\n}\n',
				),
			]),
			[{className: 'ModuleBareTests', methods: ['testOne']}],
		)
	})

	it('skips files with no test class and classes with no tests', () => {
		assert.deepEqual(
			discoverTests([
				swiftFile('Screen.swift', 'class Screen {\n\tfunc navigate() {}\n}\n'),
				swiftFile('ModuleEmptyTests.swift', 'class ModuleEmptyTests: UITestCase {}\n'),
			]),
			[],
		)
	})
})

describe('packShards', () => {
	it('gives each shard the lightest available load, heaviest item first', () => {
		const shards = packShards(
			[
				{name: 'a', weight: 5},
				{name: 'b', weight: 4},
				{name: 'c', weight: 3},
				{name: 'd', weight: 2},
			],
			2,
		)
		const totals = shards.map((s) => s.reduce((n, i) => n + i.weight, 0))
		assert.deepEqual(totals, [7, 7])
	})

	it('never returns more shards than items', () => {
		assert.equal(packShards([{name: 'a', weight: 1}], 3).length, 1)
	})
})

const CLASSES = [
	{className: 'ModuleATests', methods: ['testOne', 'testTwo']},
	{className: 'ModuleBTests', methods: ['testThree']},
]

describe('weigh', () => {
	it('weighs a class by the seconds its tests took', () => {
		assert.deepEqual(
			weigh(CLASSES, {
				'ModuleATests/testOne()': 10,
				'ModuleATests/testTwo()': 20,
				'ModuleBTests/testThree()': 5,
			}),
			[
				{name: 'ModuleATests', weight: 30},
				{name: 'ModuleBTests', weight: 5},
			],
		)
	})

	it('is the ninetieth percentile of the known times, not the slowest of them', () => {
		// Ten known durations, 1 through 10. The p90 is 9; the slowest is 10.
		// A fallback set to the maximum would let one outlier -- the suite has a
		// test at nearly five times the median -- decide every new test's weight.
		const classes = [
			{className: 'ModuleATests', methods: Array.from({length: 10}, (_, i) => `test${i + 1}`)},
			{className: 'ModuleBTests', methods: ['testNew']},
		]
		const durations = Object.fromEntries(
			Array.from({length: 10}, (_, i) => [`ModuleATests/test${i + 1}()`, i + 1]),
		)

		assert.deepEqual(weigh(classes, durations), [
			{name: 'ModuleATests', weight: 55},
			{name: 'ModuleBTests', weight: 9},
		])
	})

	it('gives a test with no recorded time the p90 of the ones that have', () => {
		// A branch's new tests are never in the table -- it is cached from master --
		// so an optimistic fallback makes every branch underestimate its own shard
		// and learn the real numbers only after merging. Known: 1, 5 and 100; the
		// p90 is 100, so testFour is assumed slow rather than typical.
		const classes = [
			{className: 'ModuleATests', methods: ['testOne']},
			{className: 'ModuleBTests', methods: ['testTwo']},
			{className: 'ModuleCTests', methods: ['testThree']},
			{className: 'ModuleDTests', methods: ['testFour']},
		]

		assert.deepEqual(
			weigh(classes, {
				'ModuleATests/testOne()': 1,
				'ModuleBTests/testTwo()': 5,
				'ModuleCTests/testThree()': 100,
			}),
			[
				{name: 'ModuleATests', weight: 1},
				{name: 'ModuleBTests', weight: 5},
				{name: 'ModuleCTests', weight: 100},
				{name: 'ModuleDTests', weight: 100},
			],
		)
	})

	it('falls back to one unit per test when nothing is known', () => {
		assert.deepEqual(weigh(CLASSES, {}), [
			{name: 'ModuleATests', weight: 2},
			{name: 'ModuleBTests', weight: 1},
		])
	})

	it('rounds the rank up, so a table too small to have a ninetieth percentile uses its slowest', () => {
		// Known: 10 and 20. Nearest rank puts the p90 at the second of the two,
		// so testThree weighs 20 rather than an interpolated 19.
		assert.deepEqual(
			weigh(CLASSES, {
				'ModuleATests/testOne()': 10,
				'ModuleATests/testTwo()': 20,
			}),
			[
				{name: 'ModuleATests', weight: 30},
				{name: 'ModuleBTests', weight: 20},
			],
		)
	})

	it('sorts durations numerically, not lexicographically, when finding the percentile', () => {
		const classes = [
			{className: 'ModuleATests', methods: ['testOne']},
			{className: 'ModuleBTests', methods: ['testTwo']},
			{className: 'ModuleCTests', methods: ['testThree']},
			{className: 'ModuleDTests', methods: ['testFour']},
		]
		// Known: 1, 9, 10. The numeric p90 is 10; a lexicographic sort orders
		// "1", "10", "9" and would pick 9 instead. testFour is new, so it takes
		// the p90.
		assert.deepEqual(
			weigh(classes, {
				'ModuleATests/testOne()': 1,
				'ModuleBTests/testTwo()': 9,
				'ModuleCTests/testThree()': 10,
			}),
			[
				{name: 'ModuleATests', weight: 1},
				{name: 'ModuleBTests', weight: 9},
				{name: 'ModuleCTests', weight: 10},
				{name: 'ModuleDTests', weight: 10},
			],
		)
	})
})

describe('sanitizeDurations', () => {
	it('drops a non-numeric entry, keeping the finite ones', () => {
		assert.deepEqual(
			sanitizeDurations({
				'ModuleATests/testOne()': 10,
				'ModuleATests/testTwo()': 'oops',
			}),
			{'ModuleATests/testOne()': 10},
		)
	})

	it('drops NaN and Infinity, which are numbers but not finite ones', () => {
		assert.deepEqual(
			sanitizeDurations({
				'ModuleATests/testOne()': Number.NaN,
				'ModuleATests/testTwo()': Number.POSITIVE_INFINITY,
				'ModuleATests/testThree()': 5,
			}),
			{'ModuleATests/testThree()': 5},
		)
	})

	it('packs without throwing once a corrupt table has been sanitized', () => {
		// A NaN weight sends packShards' totals to NaN, and Math.min(...totals)
		// then finds none of them -- an unsanitized table throws here instead of
		// falling back to the p90, which is the crash this guards against.
		const durations = sanitizeDurations({
			'ModuleATests/testOne()': 'oops',
			'ModuleBTests/testThree()': 5,
		})

		assert.doesNotThrow(() => packShards(weigh(CLASSES, durations), 2))
	})
})

describe('weighMethods', () => {
	it('weighs each method on its own so a heavy class can be split', () => {
		assert.deepEqual(
			weighMethods([{className: 'ModuleATests', methods: ['testOne', 'testTwo']}], {
				'ModuleATests/testOne()': 10,
				'ModuleATests/testTwo()': 20,
			}),
			[
				{name: 'ModuleATests/testOne', weight: 10},
				{name: 'ModuleATests/testTwo', weight: 20},
			],
		)
	})

	it('falls back the same way class weighing does', () => {
		assert.deepEqual(weighMethods([{className: 'ModuleATests', methods: ['testOne']}], {}), [
			{name: 'ModuleATests/testOne', weight: 1},
		])
	})
})

describe('formatMatrix', () => {
	it('renders one -only-testing flag per item', () => {
		assert.deepEqual(formatMatrix([[{name: 'ModuleATests', weight: 1}]], 'AllAboutOlafUITests'), {
			include: [{shard: 1, tests: '-only-testing:AllAboutOlafUITests/ModuleATests'}],
		})
	})
})

describe('the real suite', () => {
	// Invariants rather than a snapshot of today's packing: a snapshot would go
	// red every time someone adds a test, which is not a bug.
	it('places every class in exactly one shard', () => {
		const classes = discoverTests(realTestFiles())
		const items = classes.map((c) => ({name: c.className, weight: c.methods.length}))
		const placed = packShards(items, 3)
			.flat()
			.map((i) => i.name)

		assert.deepEqual(placed.sort(), classes.map((c) => c.className).sort())
	})

	it('places every method in exactly one shard', () => {
		const classes = discoverTests(realTestFiles())
		const items = weighMethods(classes, {})
		const placed = packShards(items, 3)
			.flat()
			.map((i) => i.name)

		const expected = classes.flatMap((c) => c.methods.map((method) => `${c.className}/${method}`))

		// Length first: two equal sets built from arrays of different length
		// would still pass a set-only comparison, hiding a dropped method that
		// was balanced out by a duplicated one.
		assert.equal(placed.length, expected.length)
		assert.deepEqual(new Set(placed), new Set(expected))
	})

	it('finds the UITest classes and nothing else', () => {
		const found = discoverTests(realTestFiles()).map((c) => c.className)

		assert.ok(found.includes('ModuleCalendarTests'))
		// A base class with no test methods, and a page object that is not a
		// test case at all. Neither belongs in a shard.
		assert.ok(!found.includes('UITestCase'))
		assert.ok(!found.includes('Screen'))
	})

	it('balances the shards to within one class of each other', () => {
		const classes = discoverTests(realTestFiles())
		const items = classes.map((c) => ({name: c.className, weight: c.methods.length}))
		const totals = packShards(items, 3).map((s) => s.reduce((n, i) => n + i.weight, 0))
		const heaviest = Math.max(...items.map((i) => i.weight))

		assert.ok(Math.max(...totals) - Math.min(...totals) <= heaviest)
	})
})
