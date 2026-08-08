import {findFlakyTests, formatReport} from '../scripts/report-flaky-uitests.mjs'

/** A `Test Case` node as `xcresulttool get test-results tests` emits it. */
function testCase(
	name: string,
	result: string,
	repetitions: string[] = [],
	extraChildren: object[] = [],
): object {
	return {
		name,
		nodeIdentifier: `SomeTests/${name}`,
		nodeType: 'Test Case',
		result,
		children: [
			...repetitions.map((repResult, index) => ({
				name: index === 0 ? 'First Run' : `Retry ${index}`,
				nodeIdentifier: String(index + 1),
				nodeType: 'Repetition',
				result: repResult,
			})),
			...extraChildren,
		],
	}
}

/** Wrap cases in the suite/target nesting the real tree has. */
function tree(...cases: object[]): object[] {
	return [
		{
			name: 'AllAboutOlaf',
			nodeType: 'Test Plan',
			children: [
				{
					name: 'AllAboutOlafUITests',
					nodeType: 'Test Suite',
					children: cases,
				},
			],
		},
	]
}

describe('findFlakyTests', () => {
	it('reports nothing when no test was retried', () => {
		const nodes = tree(testCase('testAlwaysPasses()', 'Passed'))

		expect(findFlakyTests(nodes)).toEqual([])
	})

	it('reports a test that passed after a failed attempt', () => {
		const nodes = tree(
			testCase('testPassesOnRetry()', 'Passed', ['Failed', 'Passed']),
		)

		expect(findFlakyTests(nodes)).toEqual([
			{
				identifier: 'SomeTests/testPassesOnRetry()',
				attempts: 2,
			},
		])
	})

	it('does not report a test that failed every attempt', () => {
		const nodes = tree(
			testCase('testAlwaysFails()', 'Failed', ['Failed', 'Failed', 'Failed']),
		)

		expect(findFlakyTests(nodes)).toEqual([])
	})

	it('does not report a test whose repetitions all passed', () => {
		const nodes = tree(
			testCase('testPassesEveryTime()', 'Passed', ['Passed', 'Passed']),
		)

		expect(findFlakyTests(nodes)).toEqual([])
	})

	it('does not report a test whose failing child is not a Repetition', () => {
		const nodes = tree(
			testCase(
				'testPassesWithFailureMessage()',
				'Passed',
				[],
				[
					{
						name: 'Some assertion',
						nodeType: 'Failure Message',
						result: 'Failed',
					},
				],
			),
		)

		expect(findFlakyTests(nodes)).toEqual([])
	})
})

describe('formatReport', () => {
	it('produces nothing when no test flaked', () => {
		expect(formatReport([])).toEqual({annotations: [], summary: ''})
	})

	it('warns once per flaky test', () => {
		const {annotations} = formatReport([
			{identifier: 'A/testOne()', attempts: 2},
			{identifier: 'B/testTwo()', attempts: 3},
		])

		expect(annotations).toEqual([
			'::warning title=Flaky UITest::A/testOne() passed only after a retry (2 attempts)',
			'::warning title=Flaky UITest::B/testTwo() passed only after a retry (3 attempts)',
		])
	})

	it('tabulates the flaky tests in the summary', () => {
		const {summary} = formatReport([{identifier: 'A/testOne()', attempts: 2}])

		expect(summary).toContain('1 test passed only after a retry')
		expect(summary).toContain('| `A/testOne()` | 2 |')
	})

	it('counts more than one flaky test in plural', () => {
		const {summary} = formatReport([
			{identifier: 'A/testOne()', attempts: 2},
			{identifier: 'B/testTwo()', attempts: 2},
		])

		expect(summary).toContain('2 tests passed only after a retry')
	})
})
