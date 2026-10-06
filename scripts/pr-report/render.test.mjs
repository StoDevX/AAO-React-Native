import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

import {diffReports} from './diff.mjs'
import {COMMENT_LIMIT, MARKER, renderComment} from './render.mjs'

let KiB = 1024
let MiB = 1024 * KiB

let installed = {nodeModulesBytes: 800 * MiB, packages: {}, sizes: {}}
let publish = (gzip, images, count) => ({
	dataBytes: gzip * 4,
	dataGzipBytes: gzip,
	imageBytes: images,
	imageCount: count,
	byFile: {'faqs.json': {bytes: gzip * 4, gzipBytes: gzip}},
	byImageGroup: {spaces: images},
})
let report = (js, deps = installed, published = publish(40 * KiB, 3 * MiB, 10)) => ({
	version: 5,
	baseSha: null,
	js,
	deps,
	publish: published,
})

let baseline = report({
	hermesBytes: 4 * MiB,
	assetsBytes: 0,
	byPackage: {'date-fns': 80 * KiB, lodash: 10 * KiB, '(app)': 500 * KiB},
	byFeature: {dining: 20 * KiB},
})
let head = report({
	hermesBytes: 4 * MiB + 12 * KiB,
	assetsBytes: 0,
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
				'### Published data and images',
				'Data **40.0 KiB** (0 B, 0.0%) gzipped · images **3.00 MiB** (0 B, 0.0%)',
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

describe('renderComment published data and images', () => {
	let before = report(baseline.js, installed, publish(40 * KiB, 3 * MiB, 10))
	let after = report(head.js, installed, {
		...publish(44 * KiB, 3 * MiB + 120 * KiB, 12),
		byFile: {
			'faqs.json': {bytes: 176 * KiB, gzipBytes: 44 * KiB},
		},
		byImageGroup: {spaces: 3 * MiB + 120 * KiB},
	})
	let section = (markdown) => markdown.slice(markdown.indexOf('### Published'))

	it('renders the totals, the files and groups that changed, and the full table', () => {
		let markdown = renderComment({
			head: after,
			diff: diffReports(before, after),
			baselineNote: null,
			gate: pass,
		})
		let rows = [
			'| images/spaces | 3.00 MiB | 3.12 MiB | +120.0 KiB |',
			'| faqs.json (gzip) | 40.0 KiB | 44.0 KiB | +4.0 KiB |',
		]
		assert.equal(
			section(markdown),
			[
				'### Published data and images',
				'Data **44.0 KiB** (+4.0 KiB, +10.0%) gzipped · images **3.12 MiB** (+120.0 KiB, +3.9%, 2 new)',
				'',
				'| Changed most | Before | After | Δ |',
				'| --- | --- | --- | --- |',
				...rows,
				'',
				'<details><summary>All data files and image groups</summary>',
				'',
				'| File or group | Before | After | Δ |',
				'| --- | --- | --- | --- |',
				...rows,
				'',
				'</details>',
				'',
			].join('\n'),
		)
	})

	it('shows only this commit with no baseline', () => {
		let markdown = renderComment({
			head: after,
			diff: null,
			baselineNote: 'No baseline for `abc1234`.',
			gate: pass,
		})
		assert.equal(
			section(markdown),
			[
				'### Published data and images',
				'Data **44.0 KiB** gzipped · images **3.12 MiB** (12 files)',
				'',
			].join('\n'),
		)
	})

	it('leaves the section out when this commit could not be measured', () => {
		let markdown = renderComment({
			head: null,
			diff: null,
			baselineNote: null,
			gate: {pass: false, message: 'No size report for this commit.'},
		})
		assert.doesNotMatch(markdown, /Published data/u)
	})
})

describe('renderComment dependencies', () => {
	let size = (installed, bundled) => ({installed, bundled})
	let deps = (nodeModulesBytes, packages, sizes = {}) => ({nodeModulesBytes, packages, sizes})
	let before = report(
		baseline.js,
		deps(
			800 * MiB,
			{lodash: ['4.17.21'], react: ['19.2.2'], semver: ['7.6.0']},
			{
				'lodash@4.17.21': size(600 * KiB, 0),
				'react@19.2.2': size(2 * MiB, 100 * KiB),
				'semver@7.6.0': size(50 * KiB, 0),
			},
		),
	)
	let after = report(
		head.js,
		deps(
			804 * MiB,
			{'date-fns': ['4.1.0'], react: ['19.2.3'], semver: ['6.3.1', '7.6.0']},
			{
				'date-fns@4.1.0': size(MiB, 80 * KiB),
				'react@19.2.3': size(2 * MiB + 512 * KiB, 110 * KiB),
				'semver@6.3.1': size(40 * KiB, 0),
				'semver@7.6.0': size(50 * KiB, 0),
			},
		),
	)
	// Up to the next section, less the blank line that separates them.
	let section = (markdown) =>
		markdown
			.slice(markdown.indexOf('### Dependencies'), markdown.indexOf('### Published'))
			.replace(/\n$/u, '')

	it('renders counts, the node_modules change, the changes and the duplicates', () => {
		let markdown = renderComment({
			head: after,
			diff: diffReports(before, after),
			baselineNote: null,
			gate: pass,
		})
		let changes = [
			'| Package | Change | Δ installed | Δ in bundle |',
			'| --- | --- | --- | --- |',
			'| date-fns | added 4.1.0 | +1.00 MiB | +80.0 KiB |',
			'| react | 19.2.2 → 19.2.3 | +512.0 KiB | +10.0 KiB |',
			'| lodash | removed 4.17.21 | -600.0 KiB | 0 B |',
			'| semver | 7.6.0 → 6.3.1, 7.6.0 | +40.0 KiB | 0 B |',
			'',
		]
		assert.equal(
			section(markdown),
			[
				'### Dependencies',
				'+1 added, −1 removed, 2 bumped · node_modules **804.00 MiB** (+4.00 MiB, +0.5%)',
				'',
				...changes,
				'<details><summary>All changes and duplicates</summary>',
				'',
				...changes,
				'| Duplicate | Version | Installed | In bundle |',
				'| --- | --- | --- | --- |',
				'| semver (new) | 6.3.1 | 40.0 KiB | 0 B |',
				'| semver (new) | 7.6.0 | 50.0 KiB | 0 B |',
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
		assert.match(section(markdown), /\| a \| 1\.0\.0 \| 0 B \| 0 B \|/u)
		assert.match(section(markdown), /\| a \| 2\.0\.0 \| 0 B \| 0 B \|/u)
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
		assert.equal(
			section(markdown),
			['### Dependencies', 'node_modules **804.00 MiB**', ''].join('\n'),
		)
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

describe('renderComment native changes', () => {
	let base = {head, diff: null, baselineNote: null, gate: pass}
	let section = (markdown) => markdown.slice(markdown.indexOf('### Native changes'))

	it('lists what needs a native build', () => {
		let markdown = renderComment({
			...base,
			nativeChanges: {
				config: ['app.config.ts', 'plugins/with-custom-symbols.ts'],
				code: ['modules/audio-route/ios/AudioRouteModule.swift'],
				packages: [
					{name: 'expo-audio', kind: 'bumped', before: ['1.0.0'], after: ['1.1.0']},
					{name: 'react-native-zeroconf', kind: 'added', before: null, after: ['0.17.2']},
				],
			},
		})
		assert.equal(
			section(markdown),
			[
				'### Native changes',
				'Needs a new native build, not a JS reload. Check Info.plist, entitlements and the privacy manifest by hand.',
				'',
				'- **App config and plugins:** `app.config.ts`, `plugins/with-custom-symbols.ts`',
				'- **Native module code:** `modules/audio-route/ios/AudioRouteModule.swift`',
				'- **Dependencies that likely ship native code:** expo-audio 1.0.0 → 1.1.0, react-native-zeroconf added 0.17.2',
			].join('\n'),
		)
	})

	it('leaves out a kind with no changes', () => {
		let markdown = renderComment({
			...base,
			nativeChanges: {config: ['app.config.ts'], code: [], packages: []},
		})
		assert.doesNotMatch(markdown, /Native module code|Dependencies that likely/u)
	})

	it('shows ten files at most, then a count', () => {
		let code = Array.from(
			{length: 13},
			(_, i) => `modules/m/ios/F${String(i).padStart(2, '0')}.swift`,
		)
		let markdown = renderComment({...base, nativeChanges: {config: [], code, packages: []}})
		assert.match(markdown, /F09\.swift`, and 3 more$/u)
		assert.doesNotMatch(markdown, /F10/u)
	})

	it('leaves the section out when nothing native changed', () => {
		assert.doesNotMatch(renderComment({...base, nativeChanges: null}), /Native changes/u)
		assert.doesNotMatch(renderComment(base), /Native changes/u)
	})

	it('keeps the section when the full tables are dropped', () => {
		let markdown = renderComment(
			{...base, nativeChanges: {config: ['app.config.ts'], code: [], packages: []}},
			10,
		)
		assert.match(markdown, /### Native changes/u)
	})
})

describe('the app size section', () => {
	let base = {head, diff: null, baselineNote: null, gate: pass}
	let appReport = (installBytes, downloadBytes) => ({
		version: 1,
		sha: 'abcdef1234',
		measuredSha: 'abcdef1234',
		device: 'iPhone18,3',
		installBytes,
		downloadBytes,
		byGroup: {},
		byAsset: {},
	})
	let section = (comment) =>
		comment.slice(comment.indexOf('### App size'), comment.indexOf('### Dependencies'))

	it('says when the archive failed, with a warning', () => {
		let app = {
			needed: true,
			head: null,
			baseline: null,
			diff: null,
			total: null,
			note: null,
			runUrl: 'https://github.com/o/r/actions/runs/1',
			gate: {
				pass: true,
				warn: true,
				message:
					'No app size for this commit; the app size gate will fail this once it is enforced.',
			},
		}
		assert.equal(
			section(renderComment({...base, app})),
			[
				'### App size',
				'App size unavailable: no measurement for this commit yet. [The App size job](https://github.com/o/r/actions/runs/1) failed, or has not finished.',
				'',
				'⚠️ No app size for this commit; the app size gate will fail this once it is enforced.',
				'',
				'',
			].join('\n'),
		)
	})

	it('shows both sizes, the total, the gate and the movers', () => {
		let rows = [
			{name: 'Assets.car', before: 1024 * 1024, after: 2 * 1024 * 1024, delta: 1024 * 1024},
			{name: 'Assets.car › aurora', before: null, after: 1024 * 1024, delta: 1024 * 1024},
			{name: 'AllAboutOlaf', before: 1024, after: 1024, delta: 0},
		]
		let app = {
			needed: true,
			head: appReport(3 * 1024 * 1024, 2 * 1024 * 1024),
			baseline: appReport(2 * 1024 * 1024, 1024 * 1024),
			diff: {
				install: {
					name: 'install',
					before: 2 * 1024 * 1024,
					after: 3 * 1024 * 1024,
					delta: 1024 * 1024,
				},
				download: {
					name: 'download',
					before: 1024 * 1024,
					after: 2 * 1024 * 1024,
					delta: 1024 * 1024,
				},
				rows,
			},
			total: {name: 'total', before: 4 * 1024 * 1024, after: 5 * 1024 * 1024, delta: 1024 * 1024},
			note: null,
			gate: {pass: true, warn: true, message: 'Over.'},
		}
		assert.equal(
			section(renderComment({...base, app})),
			[
				'### App size',
				'iPhone18,3, native only: install **3.00 MiB** (+1.00 MiB, +50.0%) · download 2.00 MiB (+1.00 MiB, +100.0%)',
				'With JS and bundled images: 5.00 MiB (+1.00 MiB, +25.0%)',
				'',
				'⚠️ Over.',
				'',
				'| Changed most | Before | After | Δ |',
				'| --- | --- | --- | --- |',
				'| Assets.car | 1.00 MiB | 2.00 MiB | +1.00 MiB |',
				'| Assets.car › aurora | — | 1.00 MiB | +1.00 MiB |',
				'',
				'<details><summary>All groups and assets</summary>',
				'',
				'| Group or asset | Before | After | Δ |',
				'| --- | --- | --- | --- |',
				'| Assets.car | 1.00 MiB | 2.00 MiB | +1.00 MiB |',
				'| Assets.car › aurora | — | 1.00 MiB | +1.00 MiB |',
				'| AllAboutOlaf | 1.0 KiB | 1.0 KiB | 0 B |',
				'',
				'</details>',
				'',
				'',
			].join('\n'),
		)
	})

	it("shows the base branch's figures and this PR's total when nothing native changed", () => {
		let app = {
			needed: false,
			head: null,
			baseline: appReport(2 * 1024 * 1024, 1024 * 1024),
			diff: null,
			total: {
				name: 'total',
				before: 4 * 1024 * 1024,
				after: 4 * 1024 * 1024 + 12 * 1024,
				delta: 12 * 1024,
			},
			note: null,
			gate: {pass: true, warn: false, message: ''},
		}
		assert.equal(
			section(renderComment({...base, app})),
			[
				'### App size',
				'No native changes. Measured at `abcdef1`: install **2.00 MiB** · download 1.00 MiB',
				"With this PR's JS and bundled images: 4.01 MiB (+12.0 KiB, +0.3%)",
				'',
				'',
			].join('\n'),
		)
	})

	it('has no section without app data', () => {
		assert.doesNotMatch(renderComment(base), /App size/u)
	})

	it('keeps the headline but drops the tables past the limit', () => {
		let app = {
			needed: true,
			head: appReport(3 * MiB, 2 * MiB),
			baseline: appReport(2 * MiB, MiB),
			diff: {
				install: {name: 'install', before: 2 * MiB, after: 3 * MiB, delta: MiB},
				download: {name: 'download', before: MiB, after: 2 * MiB, delta: MiB},
				rows: [{name: 'Assets.car', before: MiB, after: 2 * MiB, delta: MiB}],
			},
			total: null,
			note: null,
			gate: {pass: true, warn: false, message: 'Within.'},
		}
		let markdown = renderComment({...base, app}, 10)
		assert.match(markdown, /### App size\niPhone18,3, native only: install \*\*3\.00 MiB\*\*/u)
		assert.doesNotMatch(markdown, /All groups and assets/u)
	})
})
