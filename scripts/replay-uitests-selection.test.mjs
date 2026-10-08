import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

import {estimateSeconds, failedTests, kindOf, summarize} from './replay-uitests-selection.mjs'

describe('kindOf', () => {
	it('calls a Renovate PR a dependency change', () => {
		assert.equal(kindOf({author: 'app/renovate', files: ['app/menus/index.tsx']}), 'dependency')
	})

	it('calls a manifest-only PR a dependency change', () => {
		assert.equal(
			kindOf({author: 'hawkrives', files: ['package.json', 'pnpm-lock.yaml']}),
			'dependency',
		)
	})

	it('calls a CI and scripts PR tooling', () => {
		assert.equal(
			kindOf({author: 'hawkrives', files: ['.github/workflows/ios.yml', 'scripts/x.mjs']}),
			'tooling',
		)
	})

	it('calls anything touching the app a feature', () => {
		assert.equal(
			kindOf({author: 'hawkrives', files: ['scripts/x.mjs', 'source/features/map/a.ts']}),
			'feature',
		)
	})
})

describe('estimateSeconds', () => {
	const classes = [
		{className: 'A', methods: ['testOne', 'testTwo']},
		{className: 'B', methods: ['testThree']},
	]
	const durations = {'A/testOne()': 60, 'A/testTwo()': 30, 'B/testThree()': 40}

	it('packs the selected classes into two shards and takes the slower', () => {
		assert.equal(estimateSeconds(['A'], classes, durations), 60)
	})

	it('packs every class when given null', () => {
		assert.equal(estimateSeconds(null, classes, durations), 70)
	})

	it('is zero when nothing is selected', () => {
		assert.equal(estimateSeconds([], classes, durations), 0)
	})
})

describe('failedTests', () => {
	// Lines as a CI job log holds them: timestamped, coloured, and formatted
	// rather than xcodebuild's raw `Test Case` lines.
	const at = '2026-10-08T03:09:25.0140000Z '
	const log = [
		`${at}Test Suite 'ModuleMapTests' started at 2026-10-08 03:09:25.014.`,
		`${at}##[error]    testA, Failed to get matching snapshot`,
		`${at}    \u001B[32m✔\u001B[0m testA (11.000 seconds)`,
		`${at}    ✔ testB (8.000 seconds)`,
		`${at}Test Suite 'ModuleNewsTests' started at 2026-10-08 03:10:25.014.`,
		`${at}##[error]    testSeriesStoriesStackInTheOrderTheyWereOpened, Failed to get matching snapshot`,
		`${at}##[error]    testSeriesStoriesStackInTheOrderTheyWereOpened, Failed to get matching snapshot`,
		`${at}Executed 2 tests, with 2 failures (0 unexpected) in 356.780 (356.788) seconds`,
	].join('\n')

	it('keeps a test whose last attempt failed and drops one a retry passed', () => {
		assert.deepEqual(failedTests(log), [
			'ModuleNewsTests/testSeriesStoriesStackInTheOrderTheyWereOpened',
		])
	})
})

describe('summarize', () => {
	const row = (number, kind, selected, extra = {}) => ({
		number,
		kind,
		all: false,
		reason: '',
		classes: [],
		selected,
		full: 100,
		failed: [],
		...extra,
	})

	it('reports median and p75 saving per kind', () => {
		const rows = [
			row(1, 'feature', 20),
			row(2, 'feature', 40),
			row(3, 'feature', 100),
			row(4, 'feature', 60),
		]
		const {byKind} = summarize(rows)
		// Savings 0.8, 0.6, 0, 0.4 sort to 0, 0.4, 0.6, 0.8; by nearest rank the
		// median is the 2nd and the p75 the 3rd.
		assert.deepEqual(byKind.feature, {count: 4, median: 0.4, p75: 0.6})
	})

	it('counts what forced every class', () => {
		const reason = 'pnpm-lock.yaml is outside app/, source/ and modules/'
		const rows = [
			row(1, 'dependency', 100, {all: true, reason}),
			row(2, 'dependency', 100, {all: true, reason}),
		]
		assert.deepEqual(summarize(rows).forcedBy, [[reason, 2]])
	})

	it('flags a PR whose failed test was in a class selection would skip', () => {
		const rows = [
			row(1, 'feature', 20, {classes: ['ModuleMenusTests'], failed: ['ModuleMapTests/testA']}),
			row(2, 'feature', 20, {classes: ['ModuleMapTests'], failed: ['ModuleMapTests/testA']}),
			row(3, 'feature', 100, {all: true, failed: ['ModuleMapTests/testA']}),
		]
		assert.deepEqual(
			summarize(rows).missed.map((missed) => missed.number),
			[1],
		)
	})
})
