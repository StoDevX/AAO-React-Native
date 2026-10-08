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
let pass = {kind: 'within', pass: true, limit: 50 * KiB, message: 'Within the 50.0 KiB limit.'}
let METHOD =
	'<sub>Package and feature sizes are minified JS from the source map; the gate uses bytecode.</sub>'

/** The comment for `head` against `baseline`, with any other inputs overridden. */
let render = (overrides = {}, options) =>
	renderComment(
		{head, diff: diffReports(baseline, head), baselineNote: null, gate: pass, ...overrides},
		options,
	)

/** The alert of `type` as its lines, or null when the comment has none. */
let alert = (markdown, type) => {
	let lines = markdown.split('\n')
	let start = lines.indexOf(`> [!${type}]`)
	if (start === -1) {
		return null
	}
	let end = lines.findIndex((line, i) => i > start && !line.startsWith('>'))
	return lines.slice(start, end).join('\n')
}

/** The second line: the headline under the marker. */
let headline = (markdown) => markdown.split('\n')[1]

/** A regular expression matching `lines` exactly, one after another. */
let rows = (lines) => new RegExp(lines.join('\n').replaceAll(/[|()+.*]/gu, '\\$&'), 'u')

describe('renderComment', () => {
	it('folds the sizes away when nothing changed', () => {
		assert.equal(
			render({diff: diffReports(head, head)}),
			[
				MARKER,
				'✅ **No size changes**',
				'',
				'<details><summary>Sizes</summary>',
				'',
				'| | Size |',
				'| --- | ---: |',
				'| JS · Hermes bytecode | 4.01 MiB |',
				'| node_modules | 800.00 MiB |',
				'| Published data (gzipped) | 40.0 KiB |',
				'| Published images | 3.00 MiB |',
				'',
				'</details>',
				'',
			].join('\n'),
		)
	})

	it('leads with the change, then the sizes, then a section for what moved', () => {
		assert.equal(
			render(),
			[
				MARKER,
				'✅ **JS +12.0 KiB**, within the 50.0 KiB limit',
				'',
				'| | Size | Change |',
				'| --- | ---: | ---: |',
				'| JS · Hermes bytecode | 4.01 MiB | +12.0 KiB (+0.3%) |',
				'| node_modules | 800.00 MiB | — |',
				'| Published data (gzipped) | 40.0 KiB | — |',
				'| Published images | 3.00 MiB | — |',
				'',
				'### JS bundle',
				'',
				'| Changed most | Before | After | Δ |',
				'| --- | ---: | ---: | ---: |',
				'| date-fns | 80.0 KiB | 91.0 KiB | +11.0 KiB |',
				'| lodash | 10.0 KiB | — | -10.0 KiB |',
				'| zod | — | 2.0 KiB | +2.0 KiB |',
				'',
				'| Features changed most | Before | After | Δ |',
				'| --- | ---: | ---: | ---: |',
				'| dining | 20.0 KiB | 21.0 KiB | +1.0 KiB |',
				'',
				METHOD,
				'',
			].join('\n'),
		)
	})

	it('fails with a caution that says what to do', () => {
		let gate = {
			kind: 'over',
			pass: false,
			limit: 10 * KiB,
			message: 'Hermes bytecode grew 12.0 KiB, over the 10.0 KiB limit. Add the label.',
		}
		let markdown = render({gate})
		assert.equal(headline(markdown), '❌ **JS +12.0 KiB**, over the 10.0 KiB limit')
		assert.equal(
			alert(markdown, 'CAUTION'),
			[
				'> [!CAUTION]',
				'> Hermes bytecode grew 12.0 KiB, over the 10.0 KiB limit. Add the label.',
			].join('\n'),
		)
	})

	it('notes growth the label accepted', () => {
		let gate = {
			kind: 'accepted',
			pass: true,
			limit: 10 * KiB,
			message: 'Hermes bytecode grew 12.0 KiB, over the 10.0 KiB limit. Growth accepted.',
		}
		let markdown = render({gate})
		assert.equal(headline(markdown), '✅ **JS +12.0 KiB**, over the 10.0 KiB limit but accepted')
		assert.equal(
			alert(markdown, 'NOTE'),
			[
				'> [!NOTE]',
				'> Hermes bytecode grew 12.0 KiB, over the 10.0 KiB limit. Growth accepted.',
			].join('\n'),
		)
		assert.equal(alert(markdown, 'CAUTION'), null)
	})

	it('celebrates a shrink of at least the growth limit, naming the biggest drops', () => {
		let before = report({
			...baseline.js,
			hermesBytes: 5 * MiB,
			byPackage: {a: 300 * KiB, b: 200 * KiB, c: 100 * KiB, d: 50 * KiB, e: KiB},
		})
		let after = report({
			...baseline.js,
			hermesBytes: 4 * MiB,
			byPackage: {a: 10 * KiB, b: 10 * KiB, c: 10 * KiB, d: 10 * KiB, e: 2 * KiB},
		})
		let markdown = render({head: after, diff: diffReports(before, after)})
		assert.equal(headline(markdown), '✅ **JS -1.00 MiB** (-20.0%)')
		assert.equal(
			alert(markdown, 'TIP'),
			['> [!TIP]', '> **Hermes bytecode shrank 1.00 MiB.** Biggest drops: a, b, c.'].join('\n'),
		)
	})

	it('leaves a small shrink uncelebrated', () => {
		let after = report({...baseline.js, hermesBytes: 4 * MiB - 2 * KiB})
		let markdown = render({head: after, diff: diffReports(baseline, after)})
		assert.equal(headline(markdown), '✅ **JS -2.0 KiB** (-0.05%)')
		assert.equal(alert(markdown, 'TIP'), null)
	})

	it('notes an older baseline, with why the gate passed, in place of a footnote', () => {
		let gate = {
			kind: 'unchecked',
			pass: true,
			message: "That growth is not all this PR's, so the size gate passes.",
		}
		let baselineNote = "Compared with master at `older56`, older than this PR's base `abcdef1`."
		let markdown = render({gate, baselineNote})
		assert.equal(
			alert(markdown, 'NOTE'),
			[
				'> [!NOTE]',
				`> ${baselineNote} That growth is not all this PR's, so the size gate passes.`,
			].join('\n'),
		)
		assert.equal(markdown.split(baselineNote).length, 2)
	})

	it('footnotes a baseline note that does not weaken the comparison', () => {
		let baselineNote = "Compared with `feature/x`, this PR's base branch, at `abcdef1`."
		let markdown = render({baselineNote})
		assert.equal(alert(markdown, 'NOTE'), null)
		assert.ok(markdown.endsWith(`<sub>${baselineNote} ${METHOD.slice(5)}\n`))
	})

	it('shows only sizes, with the reason, when there is no baseline', () => {
		let gate = {
			kind: 'unchecked',
			pass: true,
			message: 'No baseline to compare with, so the size gate passes.',
		}
		assert.equal(
			render({diff: null, gate, baselineNote: 'No master report at or before `abc1234`.'}),
			[
				MARKER,
				'ℹ️ **Nothing to compare with**',
				'',
				'> [!NOTE]',
				'> No master report at or before `abc1234`. No baseline to compare with, so the size gate passes.',
				'',
				'| | Size |',
				'| --- | ---: |',
				'| JS · Hermes bytecode | 4.01 MiB |',
				'| node_modules | 800.00 MiB |',
				'| Published data (gzipped) | 40.0 KiB |',
				'| Published images | 3.00 MiB |',
				'',
			].join('\n'),
		)
	})

	it('says there is no report when this commit could not be measured', () => {
		let gate = {
			kind: 'missing',
			pass: false,
			message: 'No size report for this commit, so the size gate cannot pass.',
		}
		assert.equal(
			render({head: null, diff: null, gate}),
			[
				MARKER,
				'❌ **No size report for this commit**',
				'',
				'> [!CAUTION]',
				'> No size report for this commit, so the size gate cannot pass.',
				'',
			].join('\n'),
		)
	})

	it('puts what fails the check first, then native changes, warnings and notes', () => {
		let app = {
			needed: true,
			head: null,
			baseline: null,
			diff: null,
			total: null,
			note: null,
			runUrl: 'https://example.com/run',
			gate: {kind: 'missing', pass: true, warn: true, message: 'No app size.'},
		}
		let markdown = render({
			gate: {kind: 'over', pass: false, limit: 10 * KiB, message: 'Over.'},
			nativeChanges: {config: ['app.config.ts'], code: [], packages: []},
			app,
		})
		let order = ['CAUTION', 'IMPORTANT', 'WARNING'].map((type) => markdown.indexOf(`> [!${type}]`))
		assert.ok(
			order.every((at, i) => at > 0 && (i === 0 || at > order[i - 1])),
			order.join(', '),
		)
		assert.match(headline(markdown), /^❌ \*\*Needs a native build\*\* · \*\*JS \+12\.0 KiB\*\*/u)
	})
})

describe('renderComment JS tables', () => {
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

	it('says the source moved when packages changed but the bytecode did not', () => {
		assert.equal(headline(markdown), '✅ JS source moved, bytecode unchanged')
	})

	it('keeps ten changes at most in the top table', () => {
		let top = markdown.split('<details>')[0]
		assert.equal(top.match(/^\| p\d\d /gmu).length, 10)
		assert.doesNotMatch(top, /\| still /u)
	})

	it('collapses every changed row, and only those, when there are more than the top ten', () => {
		let details = markdown.slice(markdown.indexOf('<details>'))
		assert.match(
			details,
			/^<details><summary>All 15 changed packages \(1 unchanged\)<\/summary>$/mu,
		)
		assert.equal(details.match(/^\| p\d\d /gmu).length, 15)
		assert.doesNotMatch(details, /\| still /u)
	})

	it('collapses every row, changed or not, for the job summary', () => {
		let summary = renderComment(
			{head: wide, diff: diffReports(narrow, wide), baselineNote: null, gate: pass},
			{limit: Infinity, everyRow: true},
		)
		assert.match(summary, /<summary>All 16 packages<\/summary>/u)
		assert.match(summary, /^\| still \| 5 B \| 5 B \| — \|$/mu)
	})

	it('drops the collapsed tables, and says where they are, when the comment is too long', () => {
		let short = renderComment(
			{head: wide, diff: diffReports(narrow, wide), baselineNote: null, gate: pass},
			{limit: 10},
		)
		assert.doesNotMatch(short, /<details>/u)
		assert.match(short, /^\| p14 /mu)
		assert.match(short, /The full tables are in this run's job summary\./u)
	})

	it('stays under COMMENT_LIMIT by default', () => {
		let huge = Object.fromEntries(
			Array.from({length: 3000}, (_, i) => [`package-with-a-long-name-${i}`, i + 1]),
		)
		let big = report({...head.js, byPackage: huge})
		let comment = renderComment({
			head: big,
			diff: diffReports(baseline, big),
			baselineNote: null,
			gate: pass,
		})
		assert.ok(comment.length <= COMMENT_LIMIT)
		assert.match(comment, /The full tables are in this run's job summary\./u)
	})

	it('never drops the tables for the job summary', () => {
		let huge = Object.fromEntries(
			Array.from({length: 3000}, (_, i) => [`package-with-a-long-name-${i}`, i + 1]),
		)
		let big = report({...head.js, byPackage: huge})
		let summary = renderComment(
			{head: big, diff: diffReports(baseline, big), baselineNote: null, gate: pass},
			{limit: Infinity, everyRow: true},
		)
		assert.match(summary, /<summary>All 3003 packages<\/summary>/u)
	})
})

describe('renderComment published data and images', () => {
	let before = report(head.js, installed, publish(40 * KiB, 3 * MiB, 10))
	let after = report(head.js, installed, {
		...publish(44 * KiB, 3 * MiB + 120 * KiB, 12),
		byFile: {'faqs.json': {bytes: 176 * KiB, gzipBytes: 44 * KiB}},
		byImageGroup: {spaces: 3 * MiB + 120 * KiB},
	})
	let markdown = render({head: after, diff: diffReports(before, after)})

	it('names the changes in the headline and the table', () => {
		assert.equal(headline(markdown), '✅ published data +4.0 KiB · images +120.0 KiB')
		assert.match(
			markdown,
			/^\| Published data \(gzipped\) \| 44\.0 KiB \| \+4\.0 KiB \(\+10\.0%\) \|$/mu,
		)
		assert.match(
			markdown,
			/^\| Published images \| 3\.12 MiB \| \+120\.0 KiB \(\+3\.9%\), 2 new \|$/mu,
		)
	})

	it('lists the files and groups that changed', () => {
		assert.equal(
			markdown.slice(markdown.indexOf('### Published')),
			[
				'### Published data and images',
				'',
				'| Changed most | Before | After | Δ |',
				'| --- | ---: | ---: | ---: |',
				'| images/spaces | 3.00 MiB | 3.12 MiB | +120.0 KiB |',
				'| faqs.json (gzip) | 40.0 KiB | 44.0 KiB | +4.0 KiB |',
				'',
			].join('\n'),
		)
	})

	it('has no section when nothing published changed', () => {
		assert.doesNotMatch(render(), /### Published/u)
	})
})

describe('renderComment dependencies', () => {
	let size = (installed, bundled) => ({installed, bundled})
	let deps = (nodeModulesBytes, packages, sizes = {}) => ({nodeModulesBytes, packages, sizes})
	let before = report(
		head.js,
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
	let section = (markdown) => markdown.slice(markdown.indexOf('### Dependencies'))

	it('counts the changes in the headline, then lists them and the duplicates', () => {
		let markdown = render({head: after, diff: diffReports(before, after)})
		assert.equal(headline(markdown), '✅ 1 package added, 1 removed, 2 bumped')
		assert.match(markdown, /^\| node_modules \| 804\.00 MiB \| \+4\.00 MiB \(\+0\.5%\) \|$/mu)
		assert.equal(
			section(markdown),
			[
				'### Dependencies',
				'',
				'| Package | Change | Δ installed | Δ in bundle |',
				'| --- | --- | ---: | ---: |',
				'| date-fns | added 4.1.0 | +1.00 MiB | +80.0 KiB |',
				'| react | 19.2.2 → 19.2.3 | +512.0 KiB | +10.0 KiB |',
				'| lodash | removed 4.17.21 | -600.0 KiB | — |',
				'| semver | 7.6.0 → 6.3.1, 7.6.0 | +40.0 KiB | — |',
				'',
				'<details><summary>1 new duplicated package</summary>',
				'',
				'| Duplicate | Version | Installed | In bundle |',
				'| --- | --- | ---: | ---: |',
				'| semver (new) | 6.3.1 | 40.0 KiB | 0 B |',
				'| semver (new) | 7.6.0 | 50.0 KiB | 0 B |',
				'',
				'</details>',
				'',
			].join('\n'),
		)
	})

	it('collapses only the duplicates this PR added, but every one for the job summary', () => {
		let old = report(head.js, deps(800 * MiB, {a: ['1.0.0', '2.0.0'], b: ['1.0.0']}))
		let bumped = report(head.js, deps(800 * MiB, {a: ['1.0.0', '2.0.0'], b: ['1.1.0']}))
		let input = {head: bumped, diff: diffReports(old, bumped)}
		assert.doesNotMatch(section(render(input)), /<details>/u)
		let summary = section(render(input, {limit: Infinity, everyRow: true}))
		assert.match(summary, /<summary>1 change and 1 duplicated package<\/summary>/u)
		assert.match(summary, /^\| a \| 1\.0\.0 \| 0 B \| 0 B \|$/mu)
		assert.doesNotMatch(summary, /\(new\)/u)
	})

	it('collapses all the changes when there are more than ten', () => {
		let many = Object.fromEntries(
			Array.from({length: 15}, (_, i) => [`p${String(i).padStart(2, '0')}`, ['1.0.0']]),
		)
		let wide = report(head.js, deps(800 * MiB, many))
		let markdown = render({
			head: wide,
			diff: diffReports(report(head.js, deps(800 * MiB, {})), wide),
		})
		let [top, details] = section(markdown).split('<details>')
		assert.equal(top.match(/^\| p\d\d /gmu).length, 10)
		assert.match(details, /^<summary>All 15 changes<\/summary>$/mu)
		assert.equal(details.match(/^\| p\d\d /gmu).length, 15)
	})

	it('names node_modules in the headline, with no section, when only its bytes moved', () => {
		let grown = report(head.js, deps(800 * MiB + 289, {}))
		let markdown = render({head: grown, diff: diffReports(report(head.js), grown)})
		assert.equal(headline(markdown), '✅ node_modules +289 B')
		assert.match(markdown, /^\| node_modules \| 800\.00 MiB \| \+289 B \(<0\.01%\) \|$/mu)
		assert.doesNotMatch(markdown, /### Dependencies/u)
	})
})

describe('renderComment native changes', () => {
	let quiet = {diff: diffReports(head, head)}

	it('flags what needs a native build, and warns in the headline', () => {
		let markdown = render({
			...quiet,
			nativeChanges: {
				config: ['app.config.ts', 'plugins/with-custom-symbols.ts'],
				code: ['modules/audio-route/ios/AudioRouteModule.swift'],
				packages: [
					{name: 'expo-audio', kind: 'bumped', before: ['1.0.0'], after: ['1.1.0']},
					{name: 'react-native-zeroconf', kind: 'added', before: null, after: ['0.17.2']},
				],
			},
		})
		assert.equal(headline(markdown), '⚠️ **Needs a native build**')
		assert.equal(
			alert(markdown, 'IMPORTANT'),
			[
				'> [!IMPORTANT]',
				'> **Needs a new native build, not a JS reload.** Check Info.plist, entitlements and the privacy manifest by hand.',
				'> - **App config and plugins:** `app.config.ts`, `plugins/with-custom-symbols.ts`',
				'> - **Native module code:** `modules/audio-route/ios/AudioRouteModule.swift`',
				'> - **Dependencies that likely ship native code:** expo-audio 1.0.0 → 1.1.0, react-native-zeroconf added 0.17.2',
			].join('\n'),
		)
	})

	it('leaves out a kind with no changes', () => {
		let markdown = render({
			...quiet,
			nativeChanges: {config: ['app.config.ts'], code: [], packages: []},
		})
		assert.doesNotMatch(markdown, /Native module code|Dependencies that likely/u)
	})

	it('shows ten files at most, then a count', () => {
		let code = Array.from(
			{length: 13},
			(_, i) => `modules/m/ios/F${String(i).padStart(2, '0')}.swift`,
		)
		let markdown = render({...quiet, nativeChanges: {config: [], code, packages: []}})
		assert.match(markdown, /F09\.swift`, and 3 more$/mu)
		assert.doesNotMatch(markdown, /F10/u)
	})

	it('has no alert when nothing native changed', () => {
		assert.equal(alert(render({nativeChanges: null}), 'IMPORTANT'), null)
		assert.equal(alert(render(), 'IMPORTANT'), null)
	})

	it('keeps the alert when the collapsed tables are dropped', () => {
		let markdown = render(
			{nativeChanges: {config: ['app.config.ts'], code: [], packages: []}},
			{limit: 10},
		)
		assert.notEqual(alert(markdown, 'IMPORTANT'), null)
	})
})

describe('renderComment app size', () => {
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
	let measured = {
		needed: true,
		head: appReport(3 * MiB, 2 * MiB),
		baseline: appReport(2 * MiB, MiB),
		diff: {
			install: {name: 'install', before: 2 * MiB, after: 3 * MiB, delta: MiB},
			download: {name: 'download', before: MiB, after: 2 * MiB, delta: MiB},
			rows: [
				{name: 'Assets.car', before: MiB, after: 2 * MiB, delta: MiB},
				{name: 'Assets.car › aurora', before: null, after: MiB, delta: MiB},
				{name: 'AllAboutOlaf', before: KiB, after: KiB, delta: 0},
			],
		},
		total: {name: 'total', before: 4 * MiB, after: 5 * MiB, delta: MiB},
		note: null,
		gate: {kind: 'within', pass: true, warn: false, message: 'Within the 500.0 KiB limit.'},
	}

	it('warns, linking the job, when the archive gave no measurement', () => {
		let app = {
			needed: true,
			head: null,
			baseline: null,
			diff: null,
			total: null,
			note: null,
			runUrl: 'https://github.com/o/r/actions/runs/1',
			gate: {
				kind: 'missing',
				pass: true,
				warn: true,
				message:
					'No app size for this commit; the app size gate will fail this once it is enforced.',
			},
		}
		let markdown = render({diff: diffReports(head, head), app})
		assert.equal(headline(markdown), '⚠️ **No size changes**')
		assert.equal(
			alert(markdown, 'WARNING'),
			[
				'> [!WARNING]',
				'> App size unavailable: no measurement for this commit yet. [The App size job](https://github.com/o/r/actions/runs/1) failed, or has not finished. No app size for this commit; the app size gate will fail this once it is enforced.',
			].join('\n'),
		)
		assert.match(markdown, /^\| App install \| unavailable \|$/mu)
	})

	it('lists install, download and the total, and the groups and assets that moved', () => {
		let markdown = render({diff: diffReports(head, head), app: measured})
		assert.equal(headline(markdown), '✅ app install +1.00 MiB')
		assert.match(
			markdown,
			rows([
				'| JS · Hermes bytecode | 4.01 MiB | — |',
				'| App install · iPhone18,3 | 3.00 MiB | +1.00 MiB (+50.0%) |',
				'| App download | 2.00 MiB | +1.00 MiB (+100.0%) |',
				'| App with JS and images | 5.00 MiB | +1.00 MiB (+25.0%) |',
				'| node_modules |',
			]),
		)
		assert.equal(
			markdown.slice(markdown.indexOf('### App size')),
			[
				'### App size',
				'',
				'| Changed most | Before | After | Δ |',
				'| --- | ---: | ---: | ---: |',
				'| Assets.car | 1.00 MiB | 2.00 MiB | +1.00 MiB |',
				'| Assets.car › aurora | — | 1.00 MiB | +1.00 MiB |',
				'',
			].join('\n'),
		)
	})

	it('warns about growth over the limit while the app size gate is report-only', () => {
		let gate = {kind: 'over', pass: true, warn: true, message: 'Grew 1.00 MiB. Report-only.'}
		let markdown = render({app: {...measured, gate}})
		assert.equal(alert(markdown, 'WARNING'), '> [!WARNING]\n> Grew 1.00 MiB. Report-only.')
	})

	it('cautions when the app size gate fails', () => {
		let gate = {kind: 'over', pass: false, warn: false, message: 'Grew 1.00 MiB. Add the label.'}
		let markdown = render({app: {...measured, gate}})
		assert.match(headline(markdown), /^❌ /u)
		assert.equal(alert(markdown, 'CAUTION'), '> [!CAUTION]\n> Grew 1.00 MiB. Add the label.')
	})

	it('notes why the gate passed when there is no app size to compare with', () => {
		let app = {
			...measured,
			baseline: null,
			diff: null,
			total: {after: 5 * MiB},
			note: 'No app size for the base branch to compare with.',
			gate: {kind: 'unchecked', pass: true, warn: false, message: 'So the gate passes.'},
		}
		let markdown = render({app})
		assert.equal(
			alert(markdown, 'NOTE'),
			'> [!NOTE]\n> No app size for the base branch to compare with. So the gate passes.',
		)
		assert.match(markdown, /^\| App install · iPhone18,3 \| 3\.00 MiB \| {2}\|$/mu)
	})

	it('footnotes figures carried forward from an earlier commit', () => {
		let app = {...measured, note: 'Measured at `1234567` and carried forward.'}
		let markdown = render({app})
		assert.match(markdown, /^<sub>Measured at `1234567` and carried forward\. /mu)
		assert.equal(alert(markdown, 'NOTE'), null)
	})

	it("shows the base branch's figures, and this PR's total, when nothing native changed", () => {
		let app = {
			needed: false,
			head: null,
			baseline: appReport(2 * MiB, MiB),
			diff: null,
			total: {name: 'total', before: 4 * MiB, after: 4 * MiB + 12 * KiB, delta: 12 * KiB},
			note: null,
			gate: {pass: true, warn: false, message: ''},
		}
		let markdown = render({app})
		assert.match(
			markdown,
			rows([
				'| App install · iPhone18,3 | 2.00 MiB | — |',
				'| App download | 1.00 MiB | — |',
				'| App with JS and images | 4.01 MiB | +12.0 KiB (+0.3%) |',
			]),
		)
		assert.match(markdown, /^<sub>No native changes: app sizes measured at `abcdef1`\. /mu)
		let carried = render({app: {...app, note: 'Carried forward from `abcdef1`.'}})
		assert.doesNotMatch(carried, /Carried forward/u)
		assert.doesNotMatch(markdown, /### App size/u)
	})

	it("keeps the app's figures and section when this commit has no size report", () => {
		let gate = {kind: 'missing', pass: false, message: 'No size report for this commit.'}
		let markdown = render({head: null, diff: null, gate, app: measured})
		assert.match(
			markdown,
			rows([
				'| | Size | Change |',
				'| --- | ---: | ---: |',
				'| App install · iPhone18,3 | 3.00 MiB | +1.00 MiB (+50.0%) |',
				'| App download | 2.00 MiB | +1.00 MiB (+100.0%) |',
				'| App with JS and images | 5.00 MiB | +1.00 MiB (+25.0%) |',
				'',
				'### App size',
			]),
		)
		assert.doesNotMatch(markdown, /JS · Hermes bytecode|node_modules/u)
	})

	it('has no rows without app data', () => {
		assert.doesNotMatch(render(), /App install/u)
	})
})
