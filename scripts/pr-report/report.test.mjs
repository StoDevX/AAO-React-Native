import assert from 'node:assert/strict'
import {mkdtempSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {describe, it} from 'node:test'

import {buildPrReport, readReport} from './report.mjs'

let report = (hermesBytes, {version = 2, baseSha = 'abcdef1234'} = {}) => ({
	version,
	baseSha,
	js: {hermesBytes, byPackage: {a: 1}, byFeature: {}},
	deps: {nodeModulesBytes: 1000, packages: {a: ['1.0.0']}},
})

describe('readReport', () => {
	let dir = mkdtempSync(join(tmpdir(), 'pr-report-'))

	it('reads a report', () => {
		let path = join(dir, 'ok.json')
		writeFileSync(path, JSON.stringify(report(5)))
		assert.deepEqual(readReport(path), report(5))
	})

	it('returns null for a missing file', () => {
		assert.equal(readReport(join(dir, 'absent.json')), null)
	})

	it('returns null for a file that is not JSON', () => {
		let path = join(dir, 'bad.json')
		writeFileSync(path, '<html>expired</html>')
		assert.equal(readReport(path), null)
	})

	it('returns null for a current-version report missing js', () => {
		let path = join(dir, 'no-js.json')
		writeFileSync(path, JSON.stringify({version: 2, baseSha: null}))
		assert.equal(readReport(path), null)
	})

	it('returns null for a current-version report whose hermesBytes is not a number', () => {
		let path = join(dir, 'bad-hermes.json')
		writeFileSync(
			path,
			JSON.stringify({
				version: 2,
				baseSha: null,
				js: {hermesBytes: 'x', byPackage: {}, byFeature: {}},
				deps: {nodeModulesBytes: 1, packages: {}},
			}),
		)
		assert.equal(readReport(path), null)
	})

	it('returns null for a current-version report missing deps', () => {
		let path = join(dir, 'no-deps.json')
		let {deps, ...withoutDeps} = report(5)
		writeFileSync(path, JSON.stringify(withoutDeps))
		assert.equal(readReport(path), null)
	})

	it('returns null for a current-version report whose deps are malformed', () => {
		let path = join(dir, 'bad-deps.json')
		writeFileSync(
			path,
			JSON.stringify({...report(5), deps: {nodeModulesBytes: 'x', packages: null}}),
		)
		assert.equal(readReport(path), null)
	})

	it('reads an older-version report without checking its js shape', () => {
		let path = join(dir, 'old.json')
		writeFileSync(path, JSON.stringify({version: 0, js: {minifiedBytes: 1}}))
		assert.deepEqual(readReport(path), {version: 0, js: {minifiedBytes: 1}})
	})
})

describe('buildPrReport', () => {
	it('fails the gate when growth is over the limit', () => {
		let result = buildPrReport({
			head: report(300),
			baseline: report(100),
			comparedSha: 'abcdef1234',
			baseRef: 'master',
			labels: [],
			limit: 100,
		})
		assert.equal(result.pass, false)
		assert.match(result.comment, /Changed most|All packages/u)
	})

	it('fails when this commit has no report', () => {
		let result = buildPrReport({
			head: null,
			baseline: report(100),
			comparedSha: 'abcdef1234',
			baseRef: 'master',
			labels: [],
			limit: 100,
		})
		assert.equal(result.pass, false)
		assert.match(result.comment, /JS size unavailable/u)
	})

	it('reports an older-format report for this commit as unusable, without crashing', () => {
		// A label change reuses the report from the PR's last push, which can
		// predate a change to the report's shape and so lack `deps`.
		let {deps, ...older} = report(300, {version: 1})
		let result = buildPrReport({
			head: older,
			baseline: report(100),
			comparedSha: 'abcdef1234',
			baseRef: 'master',
			labels: [],
			limit: 100,
		})
		assert.equal(result.pass, false)
		assert.match(result.comment, /older format \(version 1\)/u)
		assert.match(result.comment, /push a commit/u)
		assert.doesNotMatch(result.comment, /Dependencies/u)
	})

	it('passes with no comparison when the PR is not based on master', () => {
		let result = buildPrReport({
			head: report(300),
			baseline: report(100),
			comparedSha: 'abcdef1234',
			baseRef: 'feature/other',
			labels: [],
			limit: 100,
		})
		assert.equal(result.pass, true)
		assert.match(
			result.comment,
			/No comparison: this PR is based on `feature\/other`, not master\./u,
		)
		assert.doesNotMatch(result.comment, /Changed most/u)
	})

	it('passes with a note when there is no baseline', () => {
		let result = buildPrReport({
			head: report(300),
			baseline: null,
			comparedSha: null,
			baseRef: 'master',
			labels: [],
			limit: 100,
		})
		assert.equal(result.pass, true)
		assert.match(result.comment, /No master report at or before `abcdef1`\./u)
	})

	it('passes with a note when the baseline is another format version', () => {
		let result = buildPrReport({
			head: report(300),
			baseline: report(100, {version: 0}),
			comparedSha: 'abcdef1234',
			baseRef: 'master',
			labels: [],
			limit: 100,
		})
		assert.equal(result.pass, true)
		assert.match(result.comment, /Baseline format changed/u)
	})

	it('names the commit the baseline came from when its format version differs', () => {
		let result = buildPrReport({
			head: report(300),
			baseline: report(100, {version: 0}),
			comparedSha: 'older5678',
			baseRef: 'master',
			labels: [],
			limit: 100,
		})
		assert.match(result.comment, /master's report for `older56` is version 0/u)
	})

	it("does not explain the gap when the baseline is exactly the PR's base", () => {
		let result = buildPrReport({
			head: report(300),
			baseline: report(100),
			comparedSha: 'abcdef1234',
			baseRef: 'master',
			labels: [],
			limit: 1000,
		})
		assert.equal(result.pass, true)
		assert.doesNotMatch(result.comment, /Compared with master/u)
	})

	it('passes with the no-comparison note when a non-master base also has no baseline', () => {
		let result = buildPrReport({
			head: report(300),
			baseline: null,
			comparedSha: null,
			baseRef: 'feature/other',
			labels: [],
			limit: 100,
		})
		assert.equal(result.pass, true)
		assert.match(
			result.comment,
			/No comparison: this PR is based on `feature\/other`, not master\./u,
		)
		assert.doesNotMatch(result.comment, /No master report at or before/u)
	})

	it('diffs against an older baseline and explains the gap, but does not gate on it', () => {
		let result = buildPrReport({
			head: report(300, {baseSha: 'abcdef1234'}),
			baseline: report(100),
			comparedSha: 'older5678',
			baseRef: 'master',
			labels: [],
			limit: 100,
		})
		assert.equal(result.pass, true)
		assert.match(
			result.comment,
			/Compared with master at `older56`, older than this PR's base `abcdef1`: growth merged in between is counted here\./u,
		)
		assert.match(result.comment, /Changed most|All packages/u)
	})

	it('separates the comment, capped at COMMENT_LIMIT, from the uncapped summary', () => {
		let huge = Object.fromEntries(
			Array.from({length: 3000}, (_, i) => [`package-with-a-long-name-${i}`, i + 1]),
		)
		let bigReport = (hermesBytes) => ({
			version: 2,
			baseSha: 'abcdef1234',
			js: {hermesBytes, byPackage: huge, byFeature: {}},
			deps: {nodeModulesBytes: 1000, packages: {}},
		})
		let result = buildPrReport({
			head: bigReport(300),
			baseline: bigReport(100),
			comparedSha: 'abcdef1234',
			baseRef: 'master',
			labels: [],
			limit: 100,
		})
		assert.doesNotMatch(result.comment, /All packages/u)
		assert.match(result.comment, /The full tables are in this run's job summary\./u)
		assert.match(result.summary, /All packages/u)
	})
})
