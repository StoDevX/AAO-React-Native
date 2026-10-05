import assert from 'node:assert/strict'
import {mkdtempSync, readFileSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {dirname, join, resolve} from 'node:path'
import {describe, it} from 'node:test'

import {buildPrReport, readAppReport, readReport} from './report.mjs'

let report = (hermesBytes, {version = 4, baseSha = 'abcdef1234'} = {}) => ({
	version,
	baseSha,
	js: {hermesBytes, assetsBytes: 0, byPackage: {a: 1}, byFeature: {}},
	deps: {
		nodeModulesBytes: 1000,
		packages: {a: ['1.0.0']},
		sizes: {'a@1.0.0': {installed: 10, bundled: 4}},
	},
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
		writeFileSync(path, JSON.stringify({version: 4, baseSha: null}))
		assert.equal(readReport(path), null)
	})

	it('returns null for a current-version report whose hermesBytes is not a number', () => {
		let path = join(dir, 'bad-hermes.json')
		writeFileSync(
			path,
			JSON.stringify({
				version: 4,
				baseSha: null,
				js: {hermesBytes: 'x', assetsBytes: 1, byPackage: {}, byFeature: {}},
				deps: {nodeModulesBytes: 1, packages: {}, sizes: {}},
			}),
		)
		assert.equal(readReport(path), null)
	})

	it('returns null for a current-version report whose assetsBytes is not a number', () => {
		let path = join(dir, 'bad-assets.json')
		let bad = report(5)
		bad.js.assetsBytes = 'x'
		writeFileSync(path, JSON.stringify(bad))
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

	it('returns null for a current-version report whose package versions are not lists of strings', () => {
		for (let packages of [{a: '1.0.0'}, {a: [1]}, ['a']]) {
			let path = join(dir, 'bad-packages.json')
			writeFileSync(
				path,
				JSON.stringify({...report(5), deps: {nodeModulesBytes: 1, packages, sizes: {}}}),
			)
			assert.equal(readReport(path), null)
		}
	})

	it('returns null for a current-version report whose sizes are malformed', () => {
		for (let sizes of [
			undefined,
			null,
			['a'],
			{a: 5},
			{a: {installed: 1}},
			{a: {installed: 'x', bundled: 1}},
		]) {
			let path = join(dir, 'bad-sizes.json')
			let deps = {nodeModulesBytes: 1, packages: {}, sizes}
			writeFileSync(path, JSON.stringify({...report(5), deps}))
			assert.equal(readReport(path), null)
		}
	})

	it('reads an older-version report without checking its js shape', () => {
		let path = join(dir, 'old.json')
		writeFileSync(path, JSON.stringify({version: 0, js: {minifiedBytes: 1}}))
		assert.deepEqual(readReport(path), {version: 0, js: {minifiedBytes: 1}})
	})
})

let appReport = (installBytes, {version = 1, measuredSha = 'abcdef1234'} = {}) => ({
	version,
	sha: 'abcdef1234',
	measuredSha,
	device: 'iPhone18,3',
	installBytes,
	downloadBytes: Math.round(installBytes / 2),
	byGroup: {'Assets.car': installBytes},
	byAsset: {windmill: installBytes},
})

describe('readAppReport', () => {
	let dir = mkdtempSync(join(tmpdir(), 'pr-report-app-'))

	it('reads a report', () => {
		let path = join(dir, 'ok.json')
		writeFileSync(path, JSON.stringify(appReport(5)))
		assert.deepEqual(readAppReport(path), appReport(5))
	})

	it('returns null for a missing file', () => {
		assert.equal(readAppReport(join(dir, 'absent.json')), null)
	})

	it('returns null for a current-version report with a malformed field', () => {
		for (let bad of [
			{installBytes: 'x'},
			{downloadBytes: null},
			{measuredSha: 5},
			{device: undefined},
			{byGroup: null},
			{byGroup: {a: 'x'}},
			{byAsset: ['a']},
		]) {
			let path = join(dir, 'bad.json')
			writeFileSync(path, JSON.stringify({...appReport(5), ...bad}))
			assert.equal(readAppReport(path), null, JSON.stringify(bad))
		}
	})

	it('reads another version without checking its shape', () => {
		let path = join(dir, 'old.json')
		writeFileSync(path, JSON.stringify({version: 0}))
		assert.deepEqual(readAppReport(path), {version: 0})
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

	it('adds the native notice for changed files, with or without a baseline', () => {
		let result = buildPrReport({
			head: report(100),
			baseline: null,
			comparedSha: null,
			baseRef: 'master',
			labels: [],
			files: ['app.config.ts', 'source/features/dining/store.ts'],
		})
		assert.match(result.comment, /### Native changes[^]*`app\.config\.ts`/u)
		assert.doesNotMatch(result.comment, /dining/u)
	})

	it('adds the native notice for a bumped native dependency', () => {
		let before = report(100)
		let after = report(100)
		before.deps.packages['expo-audio'] = ['1.0.0']
		after.deps.packages['expo-audio'] = ['1.1.0']
		let result = buildPrReport({
			head: after,
			baseline: before,
			comparedSha: 'abcdef1234',
			baseRef: 'master',
			labels: [],
			files: [],
		})
		assert.match(result.comment, /expo-audio 1\.0\.0 → 1\.1\.0/u)
	})

	it('leaves the native notice out when nothing native changed', () => {
		let result = buildPrReport({
			head: report(100),
			baseline: report(100),
			comparedSha: 'abcdef1234',
			baseRef: 'master',
			labels: [],
			files: ['data/ksto-schedule.yaml'],
		})
		assert.doesNotMatch(result.comment, /Native changes/u)
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

	it("compares a stacked PR with its base branch's report, and gates on it", () => {
		let result = buildPrReport({
			head: report(300),
			baseline: report(100),
			comparedSha: 'abcdef1234',
			baseRef: 'feature/other',
			labels: [],
			limit: 100,
		})
		assert.equal(result.pass, false)
		assert.match(
			result.comment,
			/Compared with `feature\/other`, this PR's base branch, at `abcdef1`\./u,
		)
		assert.match(result.comment, /Changed most|All packages/u)
	})

	it('passes with a note when a stacked PR has no report for its base branch', () => {
		let result = buildPrReport({
			head: report(300),
			baseline: null,
			comparedSha: null,
			baseRef: 'feature/other',
			labels: [],
			limit: 100,
		})
		assert.equal(result.pass, true)
		assert.match(result.comment, /No report for `feature\/other` at `abcdef1`\./u)
		assert.doesNotMatch(result.comment, /master/u)
	})

	it("names the base branch when a stacked PR's baseline is another format version", () => {
		let result = buildPrReport({
			head: report(300),
			baseline: report(100, {version: 0}),
			comparedSha: 'abcdef1234',
			baseRef: 'feature/other',
			labels: [],
			limit: 100,
		})
		assert.equal(result.pass, true)
		assert.match(result.comment, /`feature\/other`'s report for `abcdef1` is version 0/u)
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
			version: 4,
			baseSha: 'abcdef1234',
			js: {hermesBytes, byPackage: huge, byFeature: {}},
			deps: {nodeModulesBytes: 1000, packages: {}, sizes: {}},
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

describe('report.mjs imports', () => {
	// The workflow's `report` job installs Node but not node_modules, so
	// everything report.mjs reaches must be a relative file or a Node builtin.
	it('reach no package from node_modules', () => {
		let seen = new Set()
		let packages = []
		let visit = (file) => {
			if (seen.has(file)) {
				return
			}
			seen.add(file)
			let source = readFileSync(file, 'utf8')
			for (let [, specifier] of source.matchAll(/^import [^\n]*? from '([^']+)'/gmu)) {
				if (specifier.startsWith('./')) {
					visit(resolve(dirname(file), specifier))
				} else if (!specifier.startsWith('node:')) {
					packages.push(`${specifier} (from ${file})`)
				}
			}
		}
		visit(resolve(import.meta.dirname, 'report.mjs'))
		assert.deepEqual(packages, [])
	})
})
