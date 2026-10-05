import assert from 'node:assert/strict'
import {mkdtempSync, readFileSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {dirname, join, resolve} from 'node:path'
import {describe, it} from 'node:test'

import {buildAppSection, buildPrReport, readAppReport, readReport} from './report.mjs'

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
		assert.equal(readAppReport(undefined), null)
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

describe('buildAppSection', () => {
	let common = {labels: [], appLimit: 100, appEnforced: false}

	it('leaves the section out when nothing native changed and there is no baseline', () => {
		let app = buildAppSection({
			...common,
			needed: false,
			appHead: null,
			appBaseline: null,
			head: report(10),
			baseline: report(10),
			comparedSha: 'abcdef1234',
		})
		assert.equal(app, null)
	})

	it('warns, not fails, when a native change was not measured and the gate is report-only', () => {
		let app = buildAppSection({
			...common,
			needed: true,
			appHead: null,
			appBaseline: appReport(100),
			head: report(10),
			baseline: report(10),
			comparedSha: 'abcdef1234',
			runUrl: 'https://github.com/o/r/actions/runs/1',
		})
		assert.equal(app.runUrl, 'https://github.com/o/r/actions/runs/1')
		assert.deepEqual(app.gate, {
			pass: true,
			warn: true,
			message: 'No app size for this commit; the app size gate will fail this once it is enforced.',
		})
	})

	it('fails when a native change was not measured and the gate is enforced', () => {
		let app = buildAppSection({
			...common,
			appEnforced: true,
			needed: true,
			appHead: null,
			appBaseline: appReport(100),
			head: report(10),
			baseline: report(10),
			comparedSha: 'abcdef1234',
		})
		assert.equal(app.gate.pass, false)
	})

	it('totals native, Hermes and asset bytes on both sides', () => {
		let head = report(10)
		head.js.assetsBytes = 5
		let baseline = report(8)
		baseline.js.assetsBytes = 5
		let app = buildAppSection({
			...common,
			needed: true,
			appHead: appReport(150),
			appBaseline: appReport(100),
			head,
			baseline,
			comparedSha: 'abcdef1234',
		})
		assert.deepEqual(app.total, {name: 'total', before: 113, after: 165, delta: 52})
		assert.equal(app.diff.install.delta, 50)
	})

	it('uses the base branch native figure plus this PR JS when nothing native changed', () => {
		let app = buildAppSection({
			...common,
			needed: false,
			appHead: null,
			appBaseline: appReport(100),
			head: report(12),
			baseline: report(10),
			comparedSha: 'abcdef1234',
		})
		assert.deepEqual(app.total, {name: 'total', before: 110, after: 112, delta: 2})
		assert.equal(app.diff, null)
	})

	it('notes a baseline at another version and passes', () => {
		let app = buildAppSection({
			...common,
			needed: true,
			appHead: appReport(1000),
			appBaseline: {version: 0},
			head: report(10),
			baseline: report(10),
			comparedSha: 'abcdef1234',
		})
		assert.equal(
			app.note,
			'Baseline app size format changed (version 0), so there is nothing to compare.',
		)
		assert.equal(app.diff, null)
		assert.equal(app.gate.pass, true)
		assert.equal(app.gate.warn, false)
	})

	it('notes a missing baseline and passes', () => {
		let app = buildAppSection({
			...common,
			needed: true,
			appHead: appReport(1000),
			appBaseline: null,
			head: report(10),
			baseline: null,
			comparedSha: null,
		})
		assert.equal(app.note, 'No app size for the base branch to compare with.')
		assert.deepEqual(app.total, {after: 1010})
		assert.equal(app.gate.pass, true)
	})

	it('names the commit that measured carried-forward figures', () => {
		let app = buildAppSection({
			...common,
			needed: true,
			appHead: appReport(100),
			appBaseline: appReport(100, {measuredSha: '1234567abc'}),
			head: report(10),
			baseline: report(10),
			comparedSha: 'abcdef1234',
		})
		assert.equal(
			app.note,
			"The base branch's native figures were measured at `1234567` and carried forward.",
		)
	})

	it('passes growth against an older master commit', () => {
		let app = buildAppSection({
			...common,
			appEnforced: true,
			needed: true,
			appHead: appReport(100000),
			appBaseline: appReport(100, {measuredSha: '9999999999'}),
			head: report(10),
			baseline: report(10),
			comparedSha: '9999999999',
		})
		assert.equal(app.gate.pass, true)
		assert.match(app.gate.message, /older master commit/u)
	})
})

describe('buildPrReport with app size', () => {
	it('fails when the enforced app gate fails, even if the JS gate passes', () => {
		let result = buildPrReport({
			head: report(100),
			baseline: report(100),
			comparedSha: 'abcdef1234',
			baseRef: 'master',
			labels: [],
			limit: 100,
			appNeeded: true,
			appHead: appReport(1000),
			appBaseline: appReport(100),
			appLimit: 100,
			appEnforced: true,
		})
		assert.equal(result.pass, false)
		assert.match(result.comment, /### App size/u)
	})

	it('passes with a warning when the report-only app gate would fail', () => {
		let result = buildPrReport({
			head: report(100),
			baseline: report(100),
			comparedSha: 'abcdef1234',
			baseRef: 'master',
			labels: [],
			limit: 100,
			appNeeded: true,
			appHead: appReport(1000),
			appBaseline: appReport(100),
			appLimit: 100,
			appEnforced: false,
		})
		assert.equal(result.pass, true)
		assert.match(result.comment, /⚠️ App install size grew/u)
	})

	it('shows the app section even when this commit has no size report', () => {
		let result = buildPrReport({
			head: null,
			baseline: report(100),
			comparedSha: 'abcdef1234',
			baseRef: 'master',
			labels: [],
			appNeeded: true,
			appHead: appReport(1000),
			appBaseline: appReport(100),
		})
		assert.match(result.comment, /### App size/u)
		assert.equal(result.pass, false)
	})

	it('links an unmeasured native change to the run that tried', () => {
		let result = buildPrReport({
			head: report(100),
			baseline: report(100),
			comparedSha: 'abcdef1234',
			baseRef: 'master',
			labels: [],
			appNeeded: true,
			appHead: null,
			appBaseline: appReport(100),
			runUrl: 'https://github.com/o/r/actions/runs/1',
		})
		assert.match(result.comment, /\[this run\]\(https:\/\/github\.com\/o\/r\/actions\/runs\/1\)/u)
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
