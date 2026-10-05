import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

import {diffReports} from './diff.mjs'
import {COMMENT_LIMIT, MARKER, renderComment} from './render.mjs'

let KiB = 1024
let MiB = 1024 * KiB

let installed = {nodeModulesBytes: 800 * MiB, packages: {}}
let report = (js, deps = installed) => ({
	version: 2,
	baseSha: null,
	js,
	deps,
})

let baseline = report({
	hermesBytes: 4 * MiB,
	byPackage: {'date-fns': 80 * KiB, lodash: 10 * KiB, '(app)': 500 * KiB},
	byFeature: {dining: 20 * KiB},
})
let head = report({
	hermesBytes: 4 * MiB + 12 * KiB,
	byPackage: {'date-fns': 91 * KiB, '(app)': 500 * KiB, zod: 2 * KiB},
	byFeature: {dining: 21 * KiB},
})
let pass = {pass: true, message: 'Within the 50.0 KiB limit.'}

describe('renderComment', () => {
	it('renders the headline, the top movers and the full tables', () => {
		let markdown = renderComment({
			head,
			diff: diffReports(baseline, head),
			baselineNote: null,
			gate: pass,
		})
		assert.equal(
			markdown,
			[
				MARKER,
				'### JS bundle',
				'Hermes bytecode: **4.01 MiB** (+12.0 KiB, +0.3%)',
				'',
				'✅ Within the 50.0 KiB limit.',
				'',
				'Package and feature sizes are minified JS from the source map; the gate uses bytecode.',
				'',
				'| Changed most | Before | After | Δ |',
				'| --- | --- | --- | --- |',
				'| date-fns | 80.0 KiB | 91.0 KiB | +11.0 KiB |',
				'| lodash | 10.0 KiB | — | -10.0 KiB |',
				'| zod | — | 2.0 KiB | +2.0 KiB |',
				'',
				'| Features changed most | Before | After | Δ |',
				'| --- | --- | --- | --- |',
				'| dining | 20.0 KiB | 21.0 KiB | +1.0 KiB |',
				'',
				'<details><summary>All packages</summary>',
				'',
				'| Package | Before | After | Δ |',
				'| --- | --- | --- | --- |',
				'| date-fns | 80.0 KiB | 91.0 KiB | +11.0 KiB |',
				'| lodash | 10.0 KiB | — | -10.0 KiB |',
				'| zod | — | 2.0 KiB | +2.0 KiB |',
				'| (app) | 500.0 KiB | 500.0 KiB | 0 B |',
				'',
				'</details>',
				'',
				'<details><summary>All features</summary>',
				'',
				'| Feature | Before | After | Δ |',
				'| --- | --- | --- | --- |',
				'| dining | 20.0 KiB | 21.0 KiB | +1.0 KiB |',
				'',
				'</details>',
				'',
				'### Dependencies',
				'No package changes · node_modules **800.00 MiB** (0 B, 0.0%)',
				'',
			].join('\n'),
		)
	})

	it('leaves unchanged groups out of the top movers and keeps ten at most', () => {
		let many = Object.fromEntries(
			Array.from({length: 15}, (_, i) => [`p${String(i).padStart(2, '0')}`, i + 1]),
		)
		let wide = report({...head.js, byPackage: {...many, still: 5}, byFeature: {}})
		let narrow = report({...head.js, byPackage: {still: 5}, byFeature: {}})
		let markdown = renderComment({
			head: wide,
			diff: diffReports(narrow, wide),
			baselineNote: null,
			gate: pass,
		})
		let top = markdown.split('<details>')[0]
		assert.equal(top.match(/^\| p\d\d /gmu).length, 10)
		assert.doesNotMatch(top, /\| still /u)
	})

	it('reports totals only, with the reason, when there is no baseline', () => {
		let markdown = renderComment({
			head,
			diff: null,
			baselineNote: 'No baseline for `abc1234`.',
			gate: {pass: true, message: 'No baseline to compare with, so the size gate passes.'},
		})
		assert.match(markdown, /Hermes bytecode: \*\*4\.01 MiB\*\*/u)
		assert.match(markdown, /No baseline for `abc1234`\./u)
		assert.doesNotMatch(markdown, /Changed most/u)
	})

	it('says the size is unavailable when the head report is missing', () => {
		let markdown = renderComment({
			head: null,
			diff: null,
			baselineNote: null,
			gate: {pass: false, message: 'No size report for this commit.'},
		})
		assert.match(markdown, /JS size unavailable/u)
		assert.match(markdown, /❌ No size report for this commit\./u)
	})

	it('drops the full tables when the comment would be too long', () => {
		let huge = Object.fromEntries(
			Array.from({length: 3000}, (_, i) => [`package-with-a-long-name-${i}`, i + 1]),
		)
		let big = report({...head.js, byPackage: huge})
		let markdown = renderComment({
			head: big,
			diff: diffReports(baseline, big),
			baselineNote: null,
			gate: pass,
		})
		assert.ok(markdown.length <= COMMENT_LIMIT)
		assert.doesNotMatch(markdown, /All packages/u)
		assert.match(markdown, /The full tables are in this run's job summary\./u)
	})

	it('takes a custom limit, in place of COMMENT_LIMIT', () => {
		let markdown = renderComment(
			{head, diff: diffReports(baseline, head), baselineNote: null, gate: pass},
			10,
		)
		assert.doesNotMatch(markdown, /All packages/u)
		assert.match(markdown, /The full tables are in this run's job summary\./u)
	})

	it('never drops the tables when the limit is Infinity', () => {
		let huge = Object.fromEntries(
			Array.from({length: 3000}, (_, i) => [`package-with-a-long-name-${i}`, i + 1]),
		)
		let big = report({...head.js, byPackage: huge})
		let markdown = renderComment(
			{head: big, diff: diffReports(baseline, big), baselineNote: null, gate: pass},
			Infinity,
		)
		assert.match(markdown, /All packages/u)
	})
})

describe('renderComment dependencies', () => {
	let deps = (nodeModulesBytes, packages) => ({nodeModulesBytes, packages})
	let before = report(
		baseline.js,
		deps(800 * MiB, {lodash: ['4.17.21'], react: ['19.2.2'], semver: ['7.6.0']}),
	)
	let after = report(
		head.js,
		deps(804 * MiB, {'date-fns': ['4.1.0'], react: ['19.2.3'], semver: ['6.3.1', '7.6.0']}),
	)
	let section = (markdown) => markdown.slice(markdown.indexOf('### Dependencies'))

	it('renders counts, the node_modules change, the changes and the duplicates', () => {
		let markdown = renderComment({
			head: after,
			diff: diffReports(before, after),
			baselineNote: null,
			gate: pass,
		})
		assert.equal(
			section(markdown),
			[
				'### Dependencies',
				'+1 added, −1 removed, 2 bumped · node_modules **804.00 MiB** (+4.00 MiB, +0.5%)',
				'',
				'| Package | Change |',
				'| --- | --- |',
				'| date-fns | added 4.1.0 |',
				'| lodash | removed 4.17.21 |',
				'| react | 19.2.2 → 19.2.3 |',
				'| semver | 7.6.0 → 6.3.1, 7.6.0 |',
				'',
				'<details><summary>All changes and duplicates</summary>',
				'',
				'| Package | Change |',
				'| --- | --- |',
				'| date-fns | added 4.1.0 |',
				'| lodash | removed 4.17.21 |',
				'| react | 19.2.2 → 19.2.3 |',
				'| semver | 7.6.0 → 6.3.1, 7.6.0 |',
				'',
				'| Duplicate | Versions |',
				'| --- | --- |',
				'| semver | 6.3.1, 7.6.0 (new) |',
				'',
				'</details>',
				'',
			].join('\n'),
		)
	})

	it('lists a duplicate that was already there without the new marker', () => {
		let same = report(head.js, deps(800 * MiB, {a: ['1.0.0', '2.0.0']}))
		let markdown = renderComment({
			head: same,
			diff: diffReports(report(baseline.js, same.deps), same),
			baselineNote: null,
			gate: pass,
		})
		assert.match(section(markdown), /\| a \| 1\.0\.0, 2\.0\.0 \|/u)
		assert.doesNotMatch(section(markdown), /\(new\)/u)
		assert.doesNotMatch(section(markdown), /\| Package \| Change \|/u)
	})

	it('keeps ten changes at most in the top table', () => {
		let many = Object.fromEntries(
			Array.from({length: 15}, (_, i) => [`p${String(i).padStart(2, '0')}`, ['1.0.0']]),
		)
		let wide = report(head.js, deps(800 * MiB, many))
		let markdown = renderComment({
			head: wide,
			diff: diffReports(report(baseline.js, deps(800 * MiB, {})), wide),
			baselineNote: null,
			gate: pass,
		})
		let top = section(markdown).split('<details>')[0]
		assert.equal(top.match(/^\| p\d\d /gmu).length, 10)
	})

	it('shows only node_modules when there is no baseline', () => {
		let markdown = renderComment({
			head: after,
			diff: null,
			baselineNote: 'No baseline for `abc1234`.',
			gate: pass,
		})
		assert.equal(section(markdown), ['### Dependencies', 'node_modules **804.00 MiB**'].join('\n'))
	})

	it('leaves the section out when this commit could not be measured', () => {
		let markdown = renderComment({
			head: null,
			diff: null,
			baselineNote: null,
			gate: {pass: false, message: 'No size report for this commit.'},
		})
		assert.doesNotMatch(markdown, /Dependencies/u)
	})

	it('drops the dependency tables with the JS ones when the comment is too long', () => {
		let markdown = renderComment(
			{head: after, diff: diffReports(before, after), baselineNote: null, gate: pass},
			10,
		)
		assert.doesNotMatch(markdown, /<details>/u)
		assert.match(markdown, /\+1 added, −1 removed, 2 bumped/u)
		assert.equal(markdown.match(/The full tables are in this run's job summary\./gu).length, 1)
	})
})
