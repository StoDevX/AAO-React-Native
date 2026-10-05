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

/**
 * Renders the comment. `head` is null when this commit could not be
 * measured; `diff` is null when there is no baseline, and `baselineNote`
 * then says why. `limit` caps the rendered length, so the full tables can
 * be dropped from the PR comment but kept in the job summary (`Infinity`).
 */
export function renderComment({head, diff, baselineNote, gate}, limit = COMMENT_LIMIT) {
	let lines = [MARKER, '### JS bundle']
	if (head === null) {
		lines.push('JS size unavailable: the `js-size` job did not produce a report.')
	} else if (diff === null) {
		lines.push(`Hermes bytecode: **${formatBytes(head.js.hermesBytes)}**`)
	} else {
		lines.push(`Hermes bytecode: ${total(diff.hermes, true)}`)
	}
	if (baselineNote) {
		lines.push('', baselineNote)
	}
	lines.push('', `${gate.pass ? '✅' : '❌'} ${gate.message}`, '')
	if (diff === null) {
		return lines.join('\n')
	}

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

	let tables = [
		...fullTable('All packages', 'Package', diff.byPackage),
		...fullTable('All features', 'Feature', diff.byFeature),
	]
	let full = [...lines, ...tables].join('\n')
	if (full.length <= limit) {
		return full
	}
	lines.push("The full tables are in this run's job summary.", '')
	return lines.join('\n')
}
