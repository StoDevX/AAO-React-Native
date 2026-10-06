/**
 * Render the pull request report as the markdown of its bot comment.
 */

import {formatBytes, formatDelta, formatPercent} from './format.mjs'

/** Finds the bot's comment among a pull request's comments. */
export const MARKER = '<!-- aao-pr-report -->'

/** GitHub rejects a comment over 65,536 characters; this leaves room for the footer. */
export const COMMENT_LIMIT = 60000

const TOP_MOVERS = 10

/** A byte figure, or a dash for a side where the group does not exist. */
function cell(bytes) {
	return bytes === null ? '—' : formatBytes(bytes)
}

/** One table row for a change, labeled `name`. */
function row(name, change) {
	return `| ${name} | ${cell(change.before)} | ${cell(change.after)} | ${formatDelta(change.delta)} |`
}

/** A total with its change: `**4.01 MiB** (+12.0 KiB, +0.3%)`. */
function total(change, bold) {
	let size = bold ? `**${formatBytes(change.after)}**` : formatBytes(change.after)
	return `${size} (${formatDelta(change.delta)}, ${formatPercent(change.delta, change.before)})`
}

/** A collapsed table of every group. */
function fullTable(summary, heading, changes) {
	return [
		`<details><summary>${summary}</summary>`,
		'',
		`| ${heading} | Before | After | Δ |`,
		'| --- | --- | --- | --- |',
		...changes.map((change) => row(change.name, change)),
		'',
		'</details>',
		'',
	]
}

/** A table of the groups that changed most, or nothing when none changed. */
function moversTable(heading, changes) {
	let movers = changes
		.filter((change) => change.delta !== 0)
		.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
		.slice(0, TOP_MOVERS)
	if (movers.length === 0) {
		return []
	}
	return [
		`| ${heading} | Before | After | Δ |`,
		'| --- | --- | --- | --- |',
		...movers.map((change) => row(change.name, change)),
		'',
	]
}

/** A total with no baseline: just the size. A total with one: `total()`. */
function sized(change, bold) {
	if (change.before === undefined) {
		return bold ? `**${formatBytes(change.after)}**` : formatBytes(change.after)
	}
	return total(change, bold)
}

/** The gate's line: ✅ passed, ⚠️ passed with a warning, ❌ failed. */
function gateLine(gate) {
	return `${gate.pass ? (gate.warn ? '⚠️' : '✅') : '❌'} ${gate.message}`
}

/**
 * The app size section as its always-shown lines and its collapsed table,
 * or nothing when there is no section. See `buildAppSection` in report.mjs
 * for what each field holds.
 */
function appSize(app) {
	if (app === null) {
		return {top: [], tables: []}
	}
	let top = ['### App size']
	if (!app.needed) {
		let {baseline, total: sum} = app
		top.push(
			`No native changes. Measured at \`${baseline.measuredSha.slice(0, 7)}\`: install **${formatBytes(baseline.installBytes)}** · download ${formatBytes(baseline.downloadBytes)}`,
		)
		if (sum !== null) {
			top.push(`With this PR's JS and bundled images: ${sized(sum, false)}`)
		}
	} else if (app.head === null) {
		top.push(
			`App size unavailable: no measurement for this commit yet. [The App size job](${app.runUrl}) failed, or has not finished.`,
		)
	} else {
		let install = app.diff?.install ?? {after: app.head.installBytes}
		let download = app.diff?.download ?? {after: app.head.downloadBytes}
		top.push(
			`${app.head.device}, native only: install ${sized(install, true)} · download ${sized(download, false)}`,
		)
		if (app.total !== null) {
			top.push(`With JS and bundled images: ${sized(app.total, false)}`)
		}
	}
	if (app.note) {
		top.push('', app.note)
	}
	if (app.needed) {
		top.push('', gateLine(app.gate))
	}
	top.push('')
	if (app.diff === null) {
		return {top, tables: []}
	}
	return {
		top: [...top, ...moversTable('Changed most', app.diff.rows)],
		tables: fullTable('All groups and assets', 'Group or asset', app.diff.rows),
	}
}

/** What happened to a package, in a table cell: `added 4.1.0`, `19.2.2 → 19.2.3`. */
function changeText({kind, before, after}) {
	if (kind === 'added') {
		return `added ${after.join(', ')}`
	}
	if (kind === 'removed') {
		return `removed ${before.join(', ')}`
	}
	return `${before.join(', ')} → ${after.join(', ')}`
}

/** A table of package changes, with the bytes each adds, or nothing when there are none. */
function changesTable(changes) {
	if (changes.length === 0) {
		return []
	}
	return [
		'| Package | Change | Δ installed | Δ in bundle |',
		'| --- | --- | --- | --- |',
		...changes.map(
			(change) =>
				`| ${change.name} | ${changeText(change)} | ${formatDelta(change.installedDelta)} | ${formatDelta(change.bundledDelta)} |`,
		),
		'',
	]
}

/** A table of packages installed at two or more versions, a row for each version, or nothing. */
function duplicatesTable(duplicates) {
	if (duplicates.length === 0) {
		return []
	}
	return [
		'| Duplicate | Version | Installed | In bundle |',
		'| --- | --- | --- | --- |',
		...duplicates.flatMap((duplicate) =>
			duplicate.versions.map(
				(v) =>
					`| ${duplicate.name}${duplicate.isNew ? ' (new)' : ''} | ${v.version} | ${formatBytes(v.installed)} | ${formatBytes(v.bundled)} |`,
			),
		),
		'',
	]
}

/**
 * The dependency section as its always-shown lines and its collapsed tables.
 * With no diff there is only this commit's `node_modules` size.
 */
function dependencies(head, diff) {
	if (diff === null) {
		return {
			top: ['### Dependencies', `node_modules **${formatBytes(head.deps.nodeModulesBytes)}**`],
			tables: [],
		}
	}
	let {nodeModules, changes, duplicates} = diff.deps
	let count = (kind) => changes.filter((change) => change.kind === kind).length
	let counts =
		changes.length === 0
			? 'No package changes'
			: `+${count('added')} added, −${count('removed')} removed, ${count('bumped')} bumped`
	let top = [
		'### Dependencies',
		`${counts} · node_modules ${total(nodeModules, true)}`,
		'',
		...changesTable(changes.slice(0, TOP_MOVERS)),
	]
	if (changes.length === 0 && duplicates.length === 0) {
		return {top, tables: []}
	}
	return {
		top,
		tables: [
			'<details><summary>All changes and duplicates</summary>',
			'',
			...changesTable(changes),
			...duplicatesTable(duplicates),
			'</details>',
			'',
		],
	}
}

/** The images line's note on how many files came or went, or nothing when the count held. */
function imageCount(newImages) {
	if (newImages === 0) {
		return ''
	}
	return `, ${Math.abs(newImages)} ${newImages > 0 ? 'new' : 'fewer'}`
}

/**
 * The published data and images section as its always-shown lines and its
 * collapsed table. With no diff there are only this commit's figures.
 */
function publishSection(head, diff) {
	let {publish} = head
	if (diff === null) {
		return {
			top: [
				'### Published data and images',
				`Data **${formatBytes(publish.dataGzipBytes)}** gzipped · images **${formatBytes(publish.imageBytes)}** (${publish.imageCount} files)`,
				'',
			],
			tables: [],
		}
	}
	let {data, images, newImages, rows} = diff.publish
	let imageTotal = total(images, true).replace(/\)$/u, `${imageCount(newImages)})`)
	return {
		top: [
			'### Published data and images',
			`Data ${total(data, true)} gzipped · images ${imageTotal}`,
			'',
			...moversTable('Changed most', rows),
		],
		// An unchanged site is one line, not a table of zeros.
		tables: rows.some((row) => row.delta !== 0)
			? fullTable('All data files and image groups', 'File or group', rows)
			: [],
	}
}

/** A list of names, ten at most, then how many more there are. */
function listed(names) {
	let shown = names.slice(0, TOP_MOVERS).join(', ')
	let more = names.length - TOP_MOVERS
	return more > 0 ? `${shown}, and ${more} more` : shown
}

/**
 * The native-change notice, one line per kind of change, or nothing when
 * there is none.
 */
function nativeNotice(nativeChanges) {
	if (nativeChanges === null) {
		return []
	}
	let kinds = [
		['App config and plugins', nativeChanges.config.map((file) => `\`${file}\``)],
		['Native module code', nativeChanges.code.map((file) => `\`${file}\``)],
		[
			'Dependencies that likely ship native code',
			nativeChanges.packages.map((change) => `${change.name} ${changeText(change)}`),
		],
	]
	return [
		'### Native changes',
		'Needs a new native build, not a JS reload. Check Info.plist, entitlements and the privacy manifest by hand.',
		'',
		...kinds
			.filter(([, items]) => items.length > 0)
			.map(([name, items]) => `- **${name}:** ${listed(items)}`),
	]
}

/**
 * Renders the comment. `head` is null when this commit could not be
 * measured; `diff` is null when there is no baseline, and `baselineNote`
 * then says why. `limit` caps the rendered length, so the full tables can
 * be dropped from the PR comment but kept in the job summary (`Infinity`).
 * `nativeChanges` is what `findNativeChanges` found, or null/absent for none.
 * `app` is the app size section from `buildAppSection`, or null for none.
 */
export function renderComment(
	{head, diff, baselineNote, gate, nativeChanges = null, app = null},
	limit = COMMENT_LIMIT,
) {
	let lines = [MARKER, '### JS bundle']
	if (head === null) {
		lines.push('JS size unavailable: there is no usable size report for this commit.')
	} else if (diff === null) {
		lines.push(`Hermes bytecode: **${formatBytes(head.js.hermesBytes)}**`)
	} else {
		lines.push(`Hermes bytecode: ${total(diff.hermes, true)}`)
	}
	if (baselineNote) {
		lines.push('', baselineNote)
	}
	lines.push('', `${gate.pass ? '✅' : '❌'} ${gate.message}`, '')
	let tables = []
	if (diff !== null) {
		// The tables below are minified JS source bytes from the source map,
		// not the Hermes bytecode the headline and gate measure.
		lines.push(
			'Package and feature sizes are minified JS from the source map; the gate uses bytecode.',
			'',
			// Features break down `(app)`, so they get their own table: mixed in
			// with the packages, one change would take two of the slots.
			...moversTable('Changed most', diff.byPackage),
			...moversTable('Features changed most', diff.byFeature),
		)
		tables = [
			...fullTable('All packages', 'Package', diff.byPackage),
			...fullTable('All features', 'Feature', diff.byFeature),
		]
	}

	// A commit that could not be measured has no dependencies to show.
	let deps = head === null ? {top: [], tables: []} : dependencies(head, diff)
	let appSection = appSize(app)
	let publish = head === null ? {top: [], tables: []} : publishSection(head, diff)
	let native = nativeNotice(nativeChanges)
	let full = [
		...lines,
		...tables,
		...appSection.top,
		...appSection.tables,
		...deps.top,
		...deps.tables,
		...publish.top,
		...publish.tables,
		...native,
	].join('\n')
	if (
		full.length <= limit ||
		(tables.length === 0 &&
			appSection.tables.length === 0 &&
			deps.tables.length === 0 &&
			publish.tables.length === 0)
	) {
		return full
	}
	return [
		...lines,
		...appSection.top,
		...deps.top,
		...publish.top,
		"The full tables are in this run's job summary.",
		'',
		...native,
	].join('\n')
}
