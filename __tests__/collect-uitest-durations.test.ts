import {collectDurations} from '../scripts/collect-uitest-durations.mjs'

/** A `Test Case` node as `xcresulttool get test-results tests` emits it. */
function testCase(name: string, result: string, durationInSeconds: number): object {
	return {
		name: `${name}()`,
		nodeIdentifier: `SomeTests/${name}()`,
		nodeType: 'Test Case',
		result,
		durationInSeconds,
	}
}

/** Wrap cases in the suite/target nesting the real tree has. */
function tree(...cases: object[]): object[] {
	return [
		{
			name: 'AllAboutOlaf',
			nodeType: 'Test Plan',
			children: [{name: 'AllAboutOlafUITests', nodeType: 'Test Suite', children: cases}],
		},
	]
}

describe('collectDurations', () => {
	it('records the duration of a passing test', () => {
		expect(collectDurations(tree(testCase('testOne', 'Passed', 12.5)))).toEqual({
			'SomeTests/testOne()': 12.5,
		})
	})

	it('ignores skipped tests, whose near-zero duration is not a measurement', () => {
		expect(
			collectDurations(
				tree(testCase('testOne', 'Passed', 12.5), testCase('testTwo', 'Skipped', 0.4)),
			),
		).toEqual({'SomeTests/testOne()': 12.5})
	})

	it('ignores failed tests, which stop early and under-report', () => {
		expect(collectDurations(tree(testCase('testOne', 'Failed', 3)))).toEqual({})
	})

	it('ignores a passing test with no duration recorded', () => {
		expect(collectDurations(tree(testCase('testOne', 'Passed', 0)))).toEqual({})
	})

	it('returns an empty table for an empty tree', () => {
		expect(collectDurations([])).toEqual({})
		expect(collectDurations(undefined)).toEqual({})
	})
})
