import assert from 'node:assert/strict'
import {mkdirSync, mkdtempSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {basename, join} from 'node:path'
import {describe, it} from 'node:test'

import {
	buildPlan,
	describePlan,
	discoverTests,
	packShards,
	formatMatrix,
	readTestDir,
	sanitizeDurations,
	weigh,
	weighMethods,
} from './split-uitests.mjs'

function swiftFile(name, text) {
	return {name, text}
}

/** Every Swift file under `uitests/`, in the order the planner reads them. */
function realTestFiles() {
	return readTestDir(join(import.meta.dirname, '..', 'uitests'))
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

	it('gives each method to the class that declares it when a file holds two', () => {
		assert.deepEqual(
			discoverTests([
				swiftFile(
					'ModuleThingTests.swift',
					'class ModuleThingDayTests: UITestCase {\n' +
						'\tfunc testOne() throws {}\n' +
						'}\n' +
						'\n' +
						'class ModuleThingWeekTests: UITestCase {\n' +
						'\tfunc testTwo() throws {}\n' +
						'}\n',
				),
			]),
			[
				{className: 'ModuleThingDayTests', methods: ['testOne']},
				{className: 'ModuleThingWeekTests', methods: ['testTwo']},
			],
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
				{name: 'ModuleATests/testOne', weight: 10, guessed: false},
				{name: 'ModuleATests/testTwo', weight: 20, guessed: false},
			],
		)
	})

	it('falls back the same way class weighing does', () => {
		assert.deepEqual(weighMethods([{className: 'ModuleATests', methods: ['testOne']}], {}), [
			{name: 'ModuleATests/testOne', weight: 1, guessed: true},
		])
	})

	it('marks a test the table has no time for as a guess', () => {
		assert.deepEqual(
			weighMethods([{className: 'ModuleATests', methods: ['testKnown', 'testNew']}], {
				'ModuleATests/testKnown()': 30,
			}),
			[
				{name: 'ModuleATests/testKnown', weight: 30, guessed: false},
				{name: 'ModuleATests/testNew', weight: 30, guessed: true},
			],
		)
	})
})

describe('buildPlan', () => {
	it("records each shard's estimate and each test's, keyed as durations are", () => {
		assert.deepEqual(
			buildPlan([
				[
					{name: 'ModuleATests/testOne', weight: 90, guessed: false},
					{name: 'ModuleATests/testTwo', weight: 10, guessed: true},
				],
				[{name: 'ModuleBTests/testThree', weight: 95, guessed: false}],
			]),
			{
				shards: {1: 100, 2: 95},
				estimates: {
					'ModuleATests/testOne()': 90,
					'ModuleATests/testTwo()': 10,
					'ModuleBTests/testThree()': 95,
				},
				guessed: ['ModuleATests/testTwo()'],
			},
		)
	})
})

describe('describePlan', () => {
	const shards = [
		[
			{name: 'ModuleATests/testOne', weight: 90, guessed: false},
			{name: 'ModuleATests/testTwo', weight: 30, guessed: true},
		],
		[{name: 'ModuleBTests/testThree', weight: 100, guessed: false}],
	]

	it("gives each shard's estimate, then its tests, longest first", () => {
		const lines = describePlan(shards)

		assert.deepEqual(lines.slice(0, 4), [
			'Shard 1: 2m 0s estimated, 2 tests',
			'  1m 30s  ModuleATests/testOne',
			'     30s  ModuleATests/testTwo (guess: no history)',
			'Shard 2: 1m 40s estimated, 1 test',
		])
	})

	it('ends with the total and the best split the tests allow', () => {
		// 220 seconds over two shards is 110 apiece, which no split of these
		// three tests reaches, but the longest test (100) does not bind.
		assert.equal(
			describePlan(shards).at(-1),
			'Total 3m 40s across 2 shards; no split can beat 1m 50s per shard.',
		)
	})

	it('names the longest test as the limit when it outlasts an even share', () => {
		const lopsided = [
			[{name: 'ModuleATests/testLong', weight: 300, guessed: false}],
			[{name: 'ModuleBTests/testShort', weight: 10, guessed: false}],
		]

		assert.equal(
			describePlan(lopsided).at(-1),
			'Total 5m 10s across 2 shards; no split can beat 5m 0s per shard, the longest test.',
		)
	})
})

describe('formatMatrix', () => {
	it('renders one -only-testing flag per item', () => {
		assert.deepEqual(
			formatMatrix([[{name: 'ModuleATests', weight: 1}]], 'AllAboutAnythingUITests'),
			{
				include: [{shard: 1, tests: '-only-testing:AllAboutAnythingUITests/ModuleATests'}],
			},
		)
	})
})

describe('readTestDir', () => {
	it('reads Swift files in subfolders too', () => {
		const dir = mkdtempSync(join(tmpdir(), 'split-uitests-'))
		mkdirSync(join(dir, 'Chaos'))
		writeFileSync(join(dir, 'ModuleATests.swift'), 'class ModuleATests: UITestCase {}')
		writeFileSync(join(dir, 'Chaos', 'ChaosTests.swift'), 'class ChaosTests: UITestCase {}')
		writeFileSync(join(dir, 'Chaos', 'notes.txt'), 'not Swift')

		assert.deepEqual(
			readTestDir(dir).map((file) => file.name),
			[join('Chaos', 'ChaosTests.swift'), 'ModuleATests.swift'],
		)
	})

	it('leaves out a skipped subfolder', () => {
		const dir = mkdtempSync(join(tmpdir(), 'split-uitests-'))
		mkdirSync(join(dir, 'Chaos'))
		writeFileSync(join(dir, 'ModuleATests.swift'), 'class ModuleATests: UITestCase {}')
		writeFileSync(join(dir, 'Chaos', 'ChaosTests.swift'), 'class ChaosTests: UITestCase {}')
		writeFileSync(join(dir, 'ChaosModuleTests.swift'), 'class ChaosModuleTests: UITestCase {}')

		assert.deepEqual(
			readTestDir(dir, {skipDirs: ['Chaos']}).map((file) => file.name),
			['ChaosModuleTests.swift', 'ModuleATests.swift'],
		)
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

	it('places every method in the suite exactly once', () => {
		// Counted straight from the Swift text rather than from discoverTests, so
		// a method the planner drops or names twice cannot also shrink the target.
		const declared = realTestFiles().flatMap((file) => [
			...file.text.matchAll(/func\s+(test\w+)\s*\(/gu),
		])
		const placed = packShards(weighMethods(discoverTests(realTestFiles()), {}), 3)
			.flat()
			.map((i) => i.name)

		assert.equal(placed.length, declared.length)
		assert.equal(new Set(placed).size, placed.length)
	})

	it('finds every test class and nothing else', () => {
		// Test classes are the ones declared in a *Tests.swift file, in any
		// folder, whichever base class they extend. The base classes and page
		// objects live in other files and hold no tests, so they are absent
		// from both lists.
		const declared = realTestFiles()
			.filter((file) => /^\w*Tests\.swift$/u.test(basename(file.name)))
			.flatMap((file) => [...file.text.matchAll(/class\s+(\w+)\s*:/gu)].map((m) => m[1]))
		const found = discoverTests(realTestFiles()).map((c) => c.className)

		// Every class in a file, not just its first: a method credited to the
		// wrong class becomes an -only-testing name that matches no test.
		const byName = (a, b) => a.localeCompare(b)
		assert.deepEqual(found.sort(byName), declared.sort(byName))
	})

	it('finds the chaos canaries, which live in a subfolder', () => {
		const found = discoverTests(realTestFiles()).map((c) => c.className)

		assert.ok(found.includes('ChaosCanaryTests'))
		assert.ok(found.includes('ChaosTests'))
	})

	it('balances the shards to within one class of each other', () => {
		const classes = discoverTests(realTestFiles())
		const items = classes.map((c) => ({name: c.className, weight: c.methods.length}))
		const totals = packShards(items, 3).map((s) => s.reduce((n, i) => n + i.weight, 0))
		const heaviest = Math.max(...items.map((i) => i.weight))

		assert.ok(Math.max(...totals) - Math.min(...totals) <= heaviest)
	})
})
