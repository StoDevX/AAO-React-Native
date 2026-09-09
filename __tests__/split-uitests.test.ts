import {readdirSync, readFileSync} from 'node:fs'
import {join} from 'node:path'
import {discoverTests, packShards, formatMatrix, weigh} from '../scripts/split-uitests.mjs'

function swiftFile(name: string, text: string): {name: string; text: string} {
	return {name, text}
}

/** Every `uitests/Module*Tests.swift`, in the order the planner reads them. */
function realTestFiles(): Array<{name: string; text: string}> {
	const dir = join(__dirname, '..', 'uitests')
	return readdirSync(dir)
		.filter((name) => name.endsWith('.swift'))
		.sort()
		.map((name) => swiftFile(name, readFileSync(join(dir, name), 'utf8')))
}

describe('discoverTests', () => {
	it('finds a class and its test methods', () => {
		expect(
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
		).toEqual([{className: 'ModuleThingTests', methods: ['testOne', 'testTwo']}])
	})

	it('accepts XCTestCase as well as UITestCase', () => {
		expect(
			discoverTests([
				swiftFile(
					'ModuleBareTests.swift',
					'class ModuleBareTests: XCTestCase {\n\tfunc testOne() throws {}\n}\n',
				),
			]),
		).toEqual([{className: 'ModuleBareTests', methods: ['testOne']}])
	})

	it('skips files with no test class and classes with no tests', () => {
		expect(
			discoverTests([
				swiftFile('Screen.swift', 'class Screen {\n\tfunc navigate() {}\n}\n'),
				swiftFile('ModuleEmptyTests.swift', 'class ModuleEmptyTests: UITestCase {}\n'),
			]),
		).toEqual([])
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
		expect(totals).toEqual([7, 7])
	})

	it('never returns more shards than items', () => {
		expect(packShards([{name: 'a', weight: 1}], 3)).toHaveLength(1)
	})
})

const CLASSES = [
	{className: 'ModuleATests', methods: ['testOne', 'testTwo']},
	{className: 'ModuleBTests', methods: ['testThree']},
]

describe('weigh', () => {
	it('weighs a class by the seconds its tests took', () => {
		expect(
			weigh(CLASSES, {
				'ModuleATests/testOne()': 10,
				'ModuleATests/testTwo()': 20,
				'ModuleBTests/testThree()': 5,
			}),
		).toEqual([
			{name: 'ModuleATests', weight: 30},
			{name: 'ModuleBTests', weight: 5},
		])
	})

	it('gives a test with no recorded time the median of the ones that have', () => {
		// Known: 10 and 20, median 15. testTwo is new, so it weighs 15.
		expect(
			weigh(CLASSES, {
				'ModuleATests/testOne()': 10,
				'ModuleBTests/testThree()': 20,
			}),
		).toEqual([
			{name: 'ModuleATests', weight: 25},
			{name: 'ModuleBTests', weight: 20},
		])
	})

	it('falls back to one unit per test when nothing is known', () => {
		expect(weigh(CLASSES, {})).toEqual([
			{name: 'ModuleATests', weight: 2},
			{name: 'ModuleBTests', weight: 1},
		])
	})

	it('uses the true middle value for an odd number of known durations, not an average', () => {
		const classes = [
			{className: 'ModuleATests', methods: ['testOne']},
			{className: 'ModuleBTests', methods: ['testTwo']},
			{className: 'ModuleCTests', methods: ['testThree']},
			{className: 'ModuleDTests', methods: ['testFour']},
		]
		// Known: 1, 5, 100. The true median is 5; an average would be ~35.3.
		// testFour is new, so it takes the median.
		expect(
			weigh(classes, {
				'ModuleATests/testOne()': 1,
				'ModuleBTests/testTwo()': 5,
				'ModuleCTests/testThree()': 100,
			}),
		).toEqual([
			{name: 'ModuleATests', weight: 1},
			{name: 'ModuleBTests', weight: 5},
			{name: 'ModuleCTests', weight: 100},
			{name: 'ModuleDTests', weight: 5},
		])
	})

	it('sorts durations numerically, not lexicographically, when finding the median', () => {
		const classes = [
			{className: 'ModuleATests', methods: ['testOne']},
			{className: 'ModuleBTests', methods: ['testTwo']},
			{className: 'ModuleCTests', methods: ['testThree']},
			{className: 'ModuleDTests', methods: ['testFour']},
		]
		// Known: 1, 9, 10. The numeric median is 9; a lexicographic sort orders
		// "1", "10", "9" and would pick 10 instead. testFour is new, so it
		// takes the median.
		expect(
			weigh(classes, {
				'ModuleATests/testOne()': 1,
				'ModuleBTests/testTwo()': 9,
				'ModuleCTests/testThree()': 10,
			}),
		).toEqual([
			{name: 'ModuleATests', weight: 1},
			{name: 'ModuleBTests', weight: 9},
			{name: 'ModuleCTests', weight: 10},
			{name: 'ModuleDTests', weight: 9},
		])
	})
})

describe('formatMatrix', () => {
	it('renders one -only-testing flag per item', () => {
		expect(formatMatrix([[{name: 'ModuleATests', weight: 1}]], 'AllAboutOlafUITests')).toEqual({
			include: [{shard: 1, tests: '-only-testing:AllAboutOlafUITests/ModuleATests'}],
		})
	})
})

describe('the real suite', () => {
	// Invariants rather than a snapshot of today's packing: a snapshot would go
	// red every time someone adds a test, which is not a bug. Step 5 of this
	// task diffs the two planners' actual output, which is the exact check.
	it('places every class in exactly one shard', () => {
		const classes = discoverTests(realTestFiles())
		const items = classes.map((c) => ({name: c.className, weight: c.methods.length}))
		const placed = packShards(items, 3)
			.flat()
			.map((i) => i.name)

		expect(placed.sort()).toEqual(classes.map((c) => c.className).sort())
	})

	it('finds the UITest classes and nothing else', () => {
		const found = discoverTests(realTestFiles()).map((c) => c.className)

		expect(found).toContain('ModuleCalendarTests')
		// A base class with no test methods, and a page object that is not a
		// test case at all. Neither belongs in a shard.
		expect(found).not.toContain('UITestCase')
		expect(found).not.toContain('Screen')
	})

	it('balances the shards to within one class of each other', () => {
		const classes = discoverTests(realTestFiles())
		const items = classes.map((c) => ({name: c.className, weight: c.methods.length}))
		const totals = packShards(items, 3).map((s) => s.reduce((n, i) => n + i.weight, 0))
		const heaviest = Math.max(...items.map((i) => i.weight))

		expect(Math.max(...totals) - Math.min(...totals)).toBeLessThanOrEqual(heaviest)
	})
})
