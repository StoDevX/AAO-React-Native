import assert from 'node:assert/strict'
import {mkdirSync, mkdtempSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {describe, it} from 'node:test'

import {
	BLOCK_END,
	BLOCK_START,
	buildBlock,
	buildShard,
	diffUitests,
	extractBlock,
	formatSeconds,
	mergeShards,
	readShardFiles,
	readUitestReport,
	spliceBlock,
} from './uitest-report.mjs'

/** A master commit, as git prints one. */
let BASE = 'abcdef1234567'.padEnd(40, '0')

let report = ({
	durations = {},
	flaky = [],
	shards = {
		1: {
			wallSeconds: 552,
			testCount: Object.keys(durations).length,
			testSeconds: Object.values(durations).reduce((total, seconds) => total + seconds, 0),
			plannedSeconds: null,
		},
	},
	result = 'success',
	baseSha = BASE,
	plan = null,
} = {}) => ({version: 2, sha: 'head', baseSha, result, shards, durations, flaky, plan})

describe('buildShard', () => {
	it('takes the durations of passing tests and the flaky ones from the result bundle', () => {
		let testNodes = [
			{
				nodeType: 'Test Case',
				nodeIdentifier: 'FooTests/testA()',
				result: 'Passed',
				durationInSeconds: 12.5,
				children: [
					{nodeType: 'Repetition', result: 'Failed', durationInSeconds: 20},
					{nodeType: 'Repetition', result: 'Passed', durationInSeconds: 5},
				],
			},
			{
				nodeType: 'Test Case',
				nodeIdentifier: 'FooTests/testB()',
				result: 'Failed',
				durationInSeconds: 3,
			},
		]
		assert.deepEqual(buildShard({shard: '2', wallSeconds: 90, testNodes}), {
			shard: '2',
			wallSeconds: 90,
			durations: {'FooTests/testA()': 5},
			flaky: [{identifier: 'FooTests/testA()', attempts: 2}],
		})
	})
})

describe('readShardFiles', () => {
	it('finds shard files however deeply the download nested them', () => {
		let dir = mkdtempSync(join(tmpdir(), 'uitest-shards-'))
		mkdirSync(join(dir, 'uitest-shard-1'))
		mkdirSync(join(dir, 'uitest-shard-2'))
		writeFileSync(join(dir, 'uitest-shard-1', 'uitest-shard.json'), '{"shard": "1"}')
		writeFileSync(join(dir, 'uitest-shard-2', 'uitest-shard.json'), '{"shard": "2"}')
		writeFileSync(join(dir, 'uitest-shard-2', 'other.json'), '{"shard": "x"}')
		assert.deepEqual(readShardFiles(dir), [{shard: '1'}, {shard: '2'}])
	})

	it('reads a directory that does not exist as no shards', () => {
		assert.deepEqual(readShardFiles(join(tmpdir(), 'uitest-shards-no-such-dir')), [])
	})
})

describe('mergeShards', () => {
	it('keys the shards, unions the tests and sorts the flaky ones', () => {
		let merged = mergeShards(
			[
				{shard: '2', wallSeconds: 60, durations: {b: 2}, flaky: [{identifier: 'b', attempts: 2}]},
				{
					shard: '1',
					wallSeconds: 90,
					durations: {a: 1, c: 3},
					flaky: [{identifier: 'a', attempts: 3}],
				},
			],
			{sha: 'head', baseSha: null, result: 'failure'},
		)
		assert.deepEqual(merged, {
			version: 2,
			sha: 'head',
			baseSha: null,
			result: 'failure',
			shards: {
				1: {wallSeconds: 90, testCount: 2, testSeconds: 4, plannedSeconds: null},
				2: {wallSeconds: 60, testCount: 1, testSeconds: 2, plannedSeconds: null},
			},
			durations: {a: 1, c: 3, b: 2},
			flaky: [
				{identifier: 'a', attempts: 3},
				{identifier: 'b', attempts: 2},
			],
			plan: null,
		})
	})

	it("sets each shard beside the planner's estimate for it, and keeps the test estimates", () => {
		let merged = mergeShards(
			[
				{shard: '1', wallSeconds: 900, durations: {a: 300}, flaky: []},
				{shard: '2', wallSeconds: 800, durations: {b: 250}, flaky: []},
			],
			{
				sha: 'head',
				baseSha: null,
				result: 'success',
				plan: {shards: {1: 280, 2: 270}, estimates: {a: 280, b: 270}, guessed: ['b']},
			},
		)
		assert.deepEqual(merged.shards, {
			1: {wallSeconds: 900, testCount: 1, testSeconds: 300, plannedSeconds: 280},
			2: {wallSeconds: 800, testCount: 1, testSeconds: 250, plannedSeconds: 270},
		})
		assert.deepEqual(merged.plan, {estimates: {a: 280, b: 270}, guessed: ['b']})
	})
})

describe('readUitestReport', () => {
	let dir = mkdtempSync(join(tmpdir(), 'uitest-report-'))
	let write = (value) => {
		let path = join(dir, 'report.json')
		writeFileSync(path, typeof value === 'string' ? value : JSON.stringify(value))
		return path
	}

	it('reads a report, dropping names that are not safe to print', () => {
		let read = readUitestReport(
			write(
				report({
					durations: {'FooTests/testA()': 1, 'x`; @someone [a](b)': 2},
					flaky: [
						{identifier: 'FooTests/testA()', attempts: 2},
						{identifier: '-->`@x`', attempts: 2},
					],
				}),
			),
		)
		assert.deepEqual(Object.keys(read.durations), ['FooTests/testA()'])
		assert.deepEqual(read.flaky, [{identifier: 'FooTests/testA()', attempts: 2}])
	})

	it('drops plan entries whose names are not safe to print', () => {
		let read = readUitestReport(
			write(
				report({
					plan: {
						estimates: {'FooTests/testA()': 30, 'x`; @someone': 40},
						guessed: ['FooTests/testA()', '-->`@x`'],
					},
				}),
			),
		)
		assert.deepEqual(read.plan, {
			estimates: {'FooTests/testA()': 30},
			guessed: ['FooTests/testA()'],
		})
	})

	it('returns null for a missing file, a file that is not JSON and a malformed report', () => {
		assert.equal(readUitestReport(join(dir, 'absent.json')), null)
		assert.equal(readUitestReport(write('<html>expired</html>')), null)
		for (let bad of [
			{...report(), shards: {1: {wallSeconds: 'x', testCount: 1}}},
			{...report(), durations: {a: 'x'}},
			{...report(), flaky: [{identifier: 'a'}]},
			{...report(), result: undefined},
			{...report(), result: '**free text** @someone'},
			{...report(), baseSha: 'abc'},
			{...report(), baseSha: undefined},
			{...report(), baseSha: 'A'.repeat(40)},
			{
				...report(),
				shards: {1: {wallSeconds: 1, testCount: 1, testSeconds: 1, plannedSeconds: 'x'}},
			},
			{...report(), shards: {1: {wallSeconds: 1, testCount: 1, plannedSeconds: null}}},
			{...report(), plan: undefined},
			{...report(), plan: {estimates: {a: 'x'}, guessed: []}},
			{...report(), plan: {estimates: {}, guessed: 'a'}},
		]) {
			assert.equal(readUitestReport(write(bad)), null)
		}
	})

	it('returns a report at another version unchecked', () => {
		let other = {version: 1, anything: true}
		assert.deepEqual(readUitestReport(write(other)), other)
	})
})

describe('diffUitests', () => {
	it('counts only tests both ran, and lists those that moved enough, biggest first', () => {
		let baseline = report({
			durations: {slow: 12, tiny: 1, steady: 100, gone: 50, quicker: 40},
			flaky: [{identifier: 'steady', attempts: 2}],
		})
		let head = report({durations: {slow: 31.4, tiny: 4, steady: 104, fresh: 70, quicker: 20}})
		let diff = diffUitests([baseline, baseline], head)
		assert.equal(diff.commonCount, 4)
		assert.equal(diff.before, 153)
		assert.equal(diff.after, 159.4)
		assert.deepEqual(
			diff.rows.map((row) => [row.name, row.delta]),
			[
				['quicker', -20],
				['slow', 19.4],
			],
		)
		assert.deepEqual([...diff.flakyOnBaseline], ['steady'])
	})

	it('flags a test only outside the range master ran it in, and compares with its median', () => {
		let baselines = [
			report({
				durations: {noisy: 30, steady: 10, slower: 10},
				flaky: [{identifier: 'a', attempts: 2}],
			}),
			report({durations: {noisy: 90, steady: 11, slower: 12}}),
			report({
				durations: {noisy: 60, steady: 12, slower: 11, newer: 20},
				flaky: [{identifier: 'b', attempts: 2}],
			}),
		]
		let head = report({durations: {noisy: 85, steady: 11, slower: 40, newer: 2}})
		let diff = diffUitests(baselines, head)
		assert.equal(diff.runs, 3)
		assert.equal(diff.commonCount, 4)
		assert.equal(diff.before, 60 + 11 + 11 + 20)
		assert.equal(diff.after, 85 + 11 + 40 + 2)
		assert.deepEqual(
			diff.rows.map((row) => [row.name, row.before, row.min, row.max, row.delta]),
			[['slower', 11, 10, 12, 29]],
		)
		assert.deepEqual(diff.flakyOnBaseline, new Set(['a', 'b']))
	})

	it('lists no test master ran only once, though it counts towards the totals', () => {
		let baselines = [
			report({durations: {steady: 10}}),
			report({durations: {steady: 10, newer: 20}}),
		]
		let diff = diffUitests(baselines, report({durations: {steady: 10, newer: 90}}))
		assert.equal(diff.commonCount, 2)
		assert.equal(diff.after, 100)
		assert.deepEqual(diff.rows, [])
	})

	it('takes the median of an even number of runs as the mean of the middle two', () => {
		let baselines = [10, 20, 30, 40].map((t) => report({durations: {t}}))
		assert.equal(diffUitests(baselines, report({durations: {t: 25}})).before, 25)
	})
})

describe('formatSeconds', () => {
	it('reads as seconds, minutes and seconds, or hours and minutes', () => {
		assert.equal(formatSeconds(32), '32s')
		assert.equal(formatSeconds(552), '9m 12s')
		assert.equal(formatSeconds(3720), '1h 2m')
		assert.equal(formatSeconds(-65), '-1m 5s')
	})
})

describe('buildBlock', () => {
	let baseline = report({
		durations: {a: 10, b: 20, c: 30},
		shards: {1: {wallSeconds: 500, testCount: 3}},
	})

	it('renders the headline, the flakes and the tests that moved', () => {
		let head = report({
			durations: {a: 10, b: 20, c: 61.4},
			flaky: [
				{identifier: 'a', attempts: 2},
				{identifier: 'b', attempts: 3},
			],
			shards: {1: {wallSeconds: 552, testCount: 3}},
		})
		let flakyBaseline = {...baseline, flaky: [{identifier: 'b', attempts: 2}]}
		assert.equal(
			buildBlock({head, baselines: [flakyBaseline, flakyBaseline], comparedSha: BASE}),
			[
				BLOCK_START,
				'### UI tests',
				'Slowest shard **9m 12s** · 3 tests, 1 shard · test time 1m 31s (master median of 2 runs: 1m 0s on the same 3, +31s)',
				'',
				'Passed only after a retry (2): `a` (2 attempts), `b` (3 attempts, also flaky on master)',
				'',
				"| Outside master's range | Master | Range | After | Δ |",
				'| --- | --- | --- | --- | --- |',
				'| `c` | 30.0 s | 30.0–30.0 s | 61.4 s | +31.4 s |',
				'',
				BLOCK_END,
			].join('\n'),
		)
	})

	it('names how many master runs the median comes from, and their range', () => {
		let runs = [10, 30, 20].map((c) => report({durations: {a: 10, b: 20, c}}))
		let head = report({durations: {a: 10, b: 20, c: 61.4}})
		let block = buildBlock({head, baselines: runs, comparedSha: BASE})
		assert.match(block, /\(master median of 3 runs: 50s on the same 3, \+41s\)/u)
		assert.match(block, /^\| `c` \| 20\.0 s \| 10\.0–30\.0 s \| 61\.4 s \| \+41\.4 s \|$/mu)
	})

	it('keeps ten rows on top and the rest, to fifty, under details', () => {
		let names = Array.from({length: 60}, (_, i) => `t${String(i).padStart(2, '0')}`)
		let slow = report({durations: Object.fromEntries(names.map((n, i) => [n, 100 + i]))})
		let fast = report({durations: Object.fromEntries(names.map((n) => [n, 10]))})
		let block = buildBlock({head: slow, baselines: [fast, fast], comparedSha: slow.baseSha})
		let [top, rest] = block.split('<details>')
		assert.equal(top.match(/^\| `t\d\d`/gmu).length, 10)
		assert.equal(rest.match(/^\| `t\d\d`/gmu).length, 40)
		assert.match(rest, /…and 10 more\./u)
	})

	it("sets each shard's planned time beside what it took, and lists the furthest estimates", () => {
		let head = report({
			durations: {a: 100, b: 40, c: 61, d: 10, e: 20, f: 31, g: 5},
			shards: {
				1: {wallSeconds: 1500, testCount: 4, testSeconds: 171, plannedSeconds: 150},
				2: {wallSeconds: 1300, testCount: 3, testSeconds: 96, plannedSeconds: 140},
			},
			plan: {
				estimates: {a: 60, b: 40, c: 60, d: 79, e: 20, f: 30, g: 6, gone: 50},
				guessed: ['d'],
			},
		})
		let block = buildBlock({head, baselines: [], comparedSha: ''})
		assert.ok(
			block.includes(
				[
					'| Shard | Planned | Test time | Wall |',
					'| --- | --- | --- | --- |',
					'| 1 | 2m 30s | 2m 51s | 25m 0s |',
					'| 2 | 2m 20s | 1m 36s | 21m 40s |',
					'',
				].join('\n'),
			),
			block,
		)
		assert.ok(
			block.includes(
				[
					'| Furthest from its estimate | Estimate | Took | Δ |',
					'| --- | --- | --- | --- |',
					'| `d` | 79.0 s (guess) | 10.0 s | -69.0 s |',
					'| `a` | 60.0 s | 100.0 s | +40.0 s |',
					'| `c` | 60.0 s | 61.0 s | +1.0 s |',
					'| `f` | 30.0 s | 31.0 s | +1.0 s |',
					'| `g` | 6.0 s | 5.0 s | -1.0 s |',
					'',
				].join('\n'),
			),
			block,
		)
	})

	it('leaves the plan out of a report that has none', () => {
		let block = buildBlock({head: baseline, baselines: [baseline], comparedSha: baseline.baseSha})
		assert.doesNotMatch(block, /Planned|Furthest from/u)
	})

	it('says so when no test needed a retry and nothing moved', () => {
		let block = buildBlock({head: baseline, baselines: [baseline], comparedSha: baseline.baseSha})
		assert.match(block, /No test needed a retry\./u)
		assert.doesNotMatch(block, /\| Slower/u)
	})

	it('says the suite did not pass when it did not', () => {
		let block = buildBlock({head: report({result: 'failure'}), baselines: [], comparedSha: ''})
		assert.match(block, /The suite did not pass \(failure\)/u)
		assert.match(block, /No master UI-test report to compare with\./u)
	})

	it('says the format changed, and names an older master commit', () => {
		assert.match(
			buildBlock({head: report(), baselines: [{version: 1}], comparedSha: 'x'}),
			/Baseline format changed \(master's report is version 1\)/u,
		)
		assert.match(
			buildBlock({
				head: report({durations: {a: 10}}),
				baselines: [{version: 1}, baseline],
				comparedSha: BASE,
			}),
			/test time 10s \(master: 10s on the same 1, 0s\)/u,
		)
		assert.match(
			buildBlock({head: report(), baselines: [baseline], comparedSha: '1234567890abc'}),
			/Compared with master at `1234567`, older than this PR's base `abcdef1`\./u,
		)
	})

	it('renders nothing without a current-version report', () => {
		assert.equal(buildBlock({head: null, baselines: [baseline], comparedSha: ''}), null)
		assert.equal(buildBlock({head: {version: 1}, baselines: [baseline], comparedSha: ''}), null)
	})
})

describe('spliceBlock', () => {
	let block = `${BLOCK_START}\nnew\n${BLOCK_END}`

	it('replaces the comment’s block, leaving the rest alone', () => {
		let comment = `top\n\n${BLOCK_START}\nold\n${BLOCK_END}\n\nbottom\n`
		assert.equal(spliceBlock(comment, block), `top\n\n${block}\n\nbottom\n`)
	})

	it('adds the block at the end of a comment without one', () => {
		assert.equal(spliceBlock('top\n\n', block), `top\n\n${block}\n`)
	})

	it('keeps a replacement’s $ patterns literal', () => {
		let tricky = `${BLOCK_START}\n$& $1\n${BLOCK_END}`
		assert.equal(spliceBlock(`a\n${block}\n`, tricky), `a\n${tricky}\n`)
	})

	it('leaves the comment alone for no block', () => {
		assert.equal(spliceBlock('top\n', null), 'top\n')
	})

	it('extracts the block, or null', () => {
		assert.equal(extractBlock(`top\n${block}\nbottom`), block)
		assert.equal(extractBlock('top'), null)
	})
})
