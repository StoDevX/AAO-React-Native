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

/** A table of package changes, or nothing when there are none. */
function changesTable(changes) {
	if (changes.length === 0) {
		return []
	}
	return [
		'| Package | Change |',
		'| --- | --- |',
		...changes.map((change) => `| ${change.name} | ${changeText(change)} |`),
		'',
	]
}

/** A table of packages installed at two or more versions, or nothing. */
function duplicatesTable(duplicates) {
	if (duplicates.length === 0) {
		return []
	}
	return [
		'| Duplicate | Versions |',
		'| --- | --- |',
		...duplicates.map(
			(duplicate) =>
				`| ${duplicate.name} | ${duplicate.versions.join(', ')}${duplicate.isNew ? ' (new)' : ''} |`,
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

/**
 * Renders the comment. `head` is null when this commit could not be
 * measured; `diff` is null when there is no baseline, and `baselineNote`
 * then says why. `limit` caps the rendered length, so the full tables can
 * be dropped from the PR comment but kept in the job summary (`Infinity`).
 */
export function renderComment({head, diff, baselineNote, gate}, limit = COMMENT_LIMIT) {
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
	let full = [...lines, ...tables, ...deps.top, ...deps.tables].join('\n')
	if (full.length <= limit || (tables.length === 0 && deps.tables.length === 0)) {
		return full
	}
	return [...lines, ...deps.top, "The full tables are in this run's job summary.", ''].join('\n')
}
