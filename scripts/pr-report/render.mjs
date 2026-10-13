/**
 * Render the pull request report as the markdown of its bot comment: a
 * headline, an alert for each thing to act on or know, a table of sizes, then
 * a section for each area that changed.
 */

import {formatBytes, formatDelta, formatPercent} from './format.mjs'
import {HERMES_GROWTH_LIMIT_BYTES} from './gate.mjs'

/** Finds the bot's comment among a pull request's comments. */
export const MARKER = '<!-- aao-pr-report -->'

/** GitHub rejects a comment over 65,536 characters; this leaves room for the footer. */
export const COMMENT_LIMIT = 60000

const TOP_MOVERS = 10

/**
 * GitHub's alert types, in the order the comment shows them: what fails the
 * check, then what needs a hand, then what to know.
 */
const ALERT_ORDER = ['CAUTION', 'IMPORTANT', 'WARNING', 'NOTE', 'TIP']

/** A byte figure, or a dash for a side where the group does not exist. */
function cell(bytes) {
	return bytes === null ? '—' : formatBytes(bytes)
}

/** A change in a Δ column: signed, or a dash for none. */
function deltaCell(delta) {
	return delta === 0 ? '—' : formatDelta(delta)
}

/**
 * A change with its share, `+12.0 KiB (+0.3%)`: a dash for none, and empty
 * with nothing to compare (no change, or one with no `before`).
 */
function changeText(change) {
	if (!change || change.before === undefined) {
		return ''
	}
	if (change.delta === 0) {
		return '—'
	}
	let percent = formatPercent(change.delta, change.before)
	return percent ? `${formatDelta(change.delta)} (${percent})` : formatDelta(change.delta)
}

/** One table row for a change, labeled `name`. */
function row(change) {
	return `| ${change.name} | ${cell(change.before)} | ${cell(change.after)} | ${deltaCell(change.delta)} |`
}

/** An alert's lines, then the blank line that ends it. */
function alertLines({type, lines}) {
	return [`> [!${type}]`, ...lines.map((line) => `> ${line}`), '']
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
		'| --- | ---: | ---: | ---: |',
		...movers.map(row),
		'',
	]
}

/**
 * A collapsed table of the groups that changed, or of every group with
 * `everyRow`. Nothing when none changed, or when the movers table above it
 * already shows every change.
 */
function collapsedTable(noun, heading, changes, everyRow) {
	let changed = changes.filter((change) => change.delta !== 0)
	if (changed.length === 0 || (!everyRow && changed.length <= TOP_MOVERS)) {
		return []
	}
	let unchanged = changes.length - changed.length
	let summary = everyRow
		? `All ${changes.length} ${noun}`
		: `All ${changed.length} changed ${noun}${unchanged > 0 ? ` (${unchanged} unchanged)` : ''}`
	return [
		`<details><summary>${summary}</summary>`,
		'',
		`| ${heading} | Before | After | Δ |`,
		'| --- | ---: | ---: | ---: |',
		...(everyRow ? changes : changed).map(row),
		'',
		'</details>',
		'',
	]
}

/** A section's always-shown lines and its collapsed tables. */
const NO_SECTION = {top: [], tables: []}

/** What happened to a package, in a table cell: `added 4.1.0`, `19.2.2 → 19.2.3`. */
function packageChangeText({kind, before, after}) {
	if (kind === 'added') {
		return `added ${after.join(', ')}`
	}
	if (kind === 'removed') {
		return `removed ${before.join(', ')}`
	}
	return `${before.join(', ')} → ${after.join(', ')}`
}

/** How many packages came, went and moved: `1 package added, 2 bumped`. */
function packageCounts(changes) {
	return ['added', 'removed', 'bumped']
		.map((kind) => [kind, changes.filter((change) => change.kind === kind).length])
		.filter(([, count]) => count > 0)
		.map(([kind, count], i) =>
			i === 0 ? `${count} ${count === 1 ? 'package' : 'packages'} ${kind}` : `${count} ${kind}`,
		)
		.join(', ')
}

/** A list of names, ten at most, then how many more there are. */
function listed(names) {
	let shown = names.slice(0, TOP_MOVERS).join(', ')
	let more = names.length - TOP_MOVERS
	return more > 0 ? `${shown}, and ${more} more` : shown
}

/** The size gate's alerts, and a tip when the bundle shrank by at least the growth limit. */
function jsAlerts(gate, baselineNote, diff) {
	let alerts = []
	if (!gate.pass) {
		alerts.push({type: 'CAUTION', lines: [gate.message]})
	} else if (gate.kind === 'accepted') {
		alerts.push({type: 'NOTE', lines: [gate.message]})
	} else if (gate.kind === 'unchecked') {
		alerts.push({type: 'NOTE', lines: [[baselineNote, gate.message].filter(Boolean).join(' ')]})
	}
	if (diff !== null && diff.hermes.delta <= -HERMES_GROWTH_LIMIT_BYTES) {
		let drops = diff.byPackage
			.filter((change) => change.delta < 0)
			.sort((a, b) => a.delta - b.delta)
			.slice(0, 3)
			.map((change) => change.name)
		let shrank = `**Hermes bytecode shrank ${formatBytes(-diff.hermes.delta)}.**`
		alerts.push({
			type: 'TIP',
			lines: [drops.length > 0 ? `${shrank} Biggest drops: ${drops.join(', ')}.` : shrank],
		})
	}
	return alerts
}

/** The native-change alert, one line per kind of change, or nothing when there is none. */
function nativeAlerts(nativeChanges) {
	if (nativeChanges === null) {
		return []
	}
	let kinds = [
		['App config and plugins', nativeChanges.config.map((file) => `\`${file}\``)],
		['Native module code', nativeChanges.code.map((file) => `\`${file}\``)],
		[
			'Dependencies that likely ship native code',
			nativeChanges.packages.map((change) => `${change.name} ${packageChangeText(change)}`),
		],
	]
	return [
		{
			type: 'IMPORTANT',
			lines: [
				'**Needs a new native build, not a JS reload.** Check Info.plist, entitlements and the privacy manifest by hand.',
				...kinds
					.filter(([, items]) => items.length > 0)
					.map(([name, items]) => `- **${name}:** ${listed(items)}`),
			],
		},
	]
}

/**
 * The app size gate's alerts. A gate for a PR with no native change is never
 * shown; `note` joins the gate's own reason when there was nothing to compare.
 */
function appAlerts(app) {
	if (app === null || !app.needed) {
		return []
	}
	let {gate} = app
	let message =
		gate.kind === 'missing'
			? `App size unavailable: no measurement for this commit yet. [The App size job](${app.runUrl}) failed, or has not finished. ${gate.message}`
			: gate.message
	if (!gate.pass) {
		return [{type: 'CAUTION', lines: [message]}]
	}
	if (gate.warn) {
		return [{type: 'WARNING', lines: [message]}]
	}
	if (gate.kind === 'accepted') {
		return [{type: 'NOTE', lines: [message]}]
	}
	if (gate.kind === 'unchecked') {
		let note = app.baseline === null ? app.note : null
		return [{type: 'NOTE', lines: [[note, message].filter(Boolean).join(' ')]}]
	}
	return []
}

/**
 * What changed, briefly, for the headline: the JS bundle against its limit,
 * then the app, packages and published files. Empty when nothing did.
 */
function changeParts(diff, gate, app) {
	let parts = []
	let {hermes, deps, publish} = diff
	if (hermes.delta !== 0) {
		let js = `**JS ${formatDelta(hermes.delta)}**`
		if (hermes.delta < 0) {
			js += ` (${formatPercent(hermes.delta, hermes.before)})`
		} else if (gate.kind === 'within') {
			js += `, within the ${formatBytes(gate.limit)} limit`
		} else if (gate.kind === 'over') {
			js += `, over the ${formatBytes(gate.limit)} limit`
		} else if (gate.kind === 'accepted') {
			js += `, over the ${formatBytes(gate.limit)} limit but accepted`
		}
		parts.push(js)
	} else if ([...diff.byPackage, ...diff.byFeature].some((change) => change.delta !== 0)) {
		parts.push('JS source moved, bytecode unchanged')
	}
	if (app?.diff && app.diff.install.delta !== 0) {
		parts.push(`app install ${formatDelta(app.diff.install.delta)}`)
	}
	if (deps.changes.length > 0) {
		parts.push(packageCounts(deps.changes))
	} else if (deps.nodeModules.delta !== 0) {
		parts.push(`node_modules ${formatDelta(deps.nodeModules.delta)}`)
	}
	if (publish.data.delta !== 0) {
		parts.push(`published data ${formatDelta(publish.data.delta)}`)
	}
	if (publish.images.delta !== 0) {
		let images = `images ${formatDelta(publish.images.delta)}`
		parts.push(publish.data.delta === 0 ? `published ${images}` : images)
	}
	return parts
}

/** The headline: an icon for the worst alert, then what changed. */
function headline({head, diff, nativeChanges}, alerts, parts) {
	let types = new Set(alerts.map((alert) => alert.type))
	let icon = '✅'
	if (types.has('CAUTION')) {
		icon = '❌'
	} else if (types.has('IMPORTANT') || types.has('WARNING')) {
		icon = '⚠️'
	} else if (head !== null && diff === null) {
		icon = 'ℹ️'
	}
	let all = [
		...(nativeChanges === null ? [] : ['**Needs a native build**']),
		...(head === null ? ['**No size report for this commit**'] : []),
		...(head !== null && diff === null ? ['**Nothing to compare with**'] : []),
		...parts,
	]
	return `${icon} ${all.length > 0 ? all.join(' · ') : '**No size changes**'}`
}

/** A change of nothing from `before`, which `changeText` shows as a dash. */
function unchanged(before) {
	return {before, delta: 0}
}

/** The app's rows in the sizes table, or none without app data. */
function appRows(app) {
	if (app === null) {
		return []
	}
	if (app.needed && app.head === null) {
		return [['App install', 'unavailable', '']]
	}
	let measured = app.needed ? app.head : app.baseline
	// With no native change the figures are the base branch's, so they did not move.
	let rows = [
		[
			`App install · ${measured.device}`,
			formatBytes(measured.installBytes),
			changeText(app.needed ? app.diff?.install : unchanged(measured.installBytes)),
		],
		[
			'App download',
			formatBytes(measured.downloadBytes),
			changeText(app.needed ? app.diff?.download : unchanged(measured.downloadBytes)),
		],
	]
	if (app.total !== null) {
		rows.push(['App with JS and images', formatBytes(app.total.after), changeText(app.total)])
	}
	return rows
}

/** The rows of the sizes table for a commit with a size report. */
function reportRows(head, diff, app) {
	let {publish} = head
	let images = changeText(diff?.publish.images)
	let newImages = diff?.publish.newImages ?? 0
	if (newImages !== 0) {
		images += `, ${Math.abs(newImages)} ${newImages > 0 ? 'new' : 'fewer'}`
	}
	return [
		['JS · Hermes bytecode', formatBytes(head.js.hermesBytes), changeText(diff?.hermes)],
		...appRows(app),
		['node_modules', formatBytes(head.deps.nodeModulesBytes), changeText(diff?.deps.nodeModules)],
		[
			'Published data (gzipped)',
			formatBytes(publish.dataGzipBytes),
			changeText(diff?.publish.data),
		],
		['Published images', formatBytes(publish.imageBytes), images],
	]
}

/**
 * The sizes table: each figure with its change when there is a baseline and
 * something changed, folded away when nothing did. With no size report it
 * holds the app's figures alone, or is nothing.
 */
function sizesTable(head, diff, app, changed) {
	let rows = head === null ? appRows(app) : reportRows(head, diff, app)
	if (rows.length === 0) {
		return []
	}
	let compared = head === null ? Boolean(app.diff) : diff !== null
	if (compared && (changed || head === null)) {
		return [
			'| | Size | Change |',
			'| --- | ---: | ---: |',
			...rows.map(([name, size, change]) => `| ${name} | ${size} | ${change} |`),
			'',
		]
	}
	let table = [
		'| | Size |',
		'| --- | ---: |',
		...rows.map(([name, size]) => `| ${name} | ${size} |`),
	]
	if (!compared) {
		return [...table, '']
	}
	return ['<details><summary>Sizes</summary>', '', ...table, '', '</details>', '']
}

/** The JS section: the packages and features that changed most, then all that changed. */
function jsSection(diff, everyRow) {
	if (diff === null) {
		return NO_SECTION
	}
	let top = [
		...moversTable('Changed most', diff.byPackage),
		// Features break down `(app)`, so they get their own table: mixed in
		// with the packages, one change would take two of the slots.
		...moversTable('Features changed most', diff.byFeature),
	]
	if (top.length === 0) {
		return NO_SECTION
	}
	return {
		top: ['### JS bundle', '', ...top],
		tables: [
			...collapsedTable('packages', 'Package', diff.byPackage, everyRow),
			...collapsedTable('features', 'Feature', diff.byFeature, everyRow),
		],
	}
}

/** The app section: the groups and assets that changed most, then all that changed. */
function appSection(app, everyRow) {
	let rows = app?.diff?.rows ?? []
	let top = moversTable('Changed most', rows)
	if (top.length === 0) {
		return NO_SECTION
	}
	return {
		top: ['### App size', '', ...top],
		tables: collapsedTable('groups and assets', 'Group or asset', rows, everyRow),
	}
}

/** A table of package changes, with the bytes each adds, or nothing when there are none. */
function changesTable(changes) {
	if (changes.length === 0) {
		return []
	}
	return [
		'| Package | Change | Δ installed | Δ in bundle |',
		'| --- | --- | ---: | ---: |',
		...changes.map(
			(change) =>
				`| ${change.name} | ${packageChangeText(change)} | ${deltaCell(change.installedDelta)} | ${deltaCell(change.bundledDelta)} |`,
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
		'| --- | --- | ---: | ---: |',
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
 * The dependency section: the first ten package changes, then, collapsed,
 * all of them and the packages this PR left installed at two or more
 * versions. `everyRow` collapses every change and every duplicate. Nothing
 * when no package changed.
 */
function depsSection(diff, everyRow) {
	if (diff === null || diff.deps.changes.length === 0) {
		return NO_SECTION
	}
	let {changes} = diff.deps
	let duplicates = everyRow
		? diff.deps.duplicates
		: diff.deps.duplicates.filter((duplicate) => duplicate.isNew)
	let allChanges = everyRow || changes.length > TOP_MOVERS ? changesTable(changes) : []
	let summary = []
	if (allChanges.length > 0) {
		summary.push(changes.length === 1 ? '1 change' : `All ${changes.length} changes`)
	}
	if (duplicates.length > 0) {
		let noun = everyRow ? 'duplicated package' : 'new duplicated package'
		summary.push(`${duplicates.length} ${noun}${duplicates.length === 1 ? '' : 's'}`)
	}
	let tables =
		summary.length === 0
			? []
			: [
					`<details><summary>${summary.join(' and ')}</summary>`,
					'',
					...allChanges,
					...duplicatesTable(duplicates),
					'</details>',
					'',
				]
	return {
		top: ['### Dependencies', '', ...changesTable(changes.slice(0, TOP_MOVERS))],
		tables,
	}
}

/** The published data and images section: the files and groups that changed. */
function publishSection(diff, everyRow) {
	let rows = diff?.publish.rows ?? []
	let top = moversTable('Changed most', rows)
	if (top.length === 0) {
		return NO_SECTION
	}
	return {
		top: ['### Published data and images', '', ...top],
		tables: collapsedTable('data files and image groups', 'File or group', rows, everyRow),
	}
}

/**
 * The small print under the comment: a baseline note that does not weaken
 * the comparison, where the app's figures came from, and what the JS tables
 * measure.
 */
function footer({baselineNote, gate, app}, js) {
	let notes = []
	if (baselineNote && gate.kind !== 'unchecked') {
		notes.push(baselineNote)
	}
	if (app !== null && !app.needed && app.baseline !== null) {
		notes.push(
			`No native changes: app sizes measured at \`${app.baseline.measuredSha.slice(0, 7)}\`.`,
		)
	}
	// With no native change the line above already says where the figures came from.
	if (app?.needed && app.note && app.baseline !== null) {
		notes.push(app.note)
	}
	if (js.top.length > 0) {
		// The JS tables are minified source bytes from the source map, not
		// the Hermes bytecode the headline and gate measure.
		notes.push(
			'Package and feature sizes are minified JS from the source map; the gate uses bytecode.',
		)
	}
	return notes.length > 0 ? [`<sub>${notes.join(' ')}</sub>`, ''] : []
}

/**
 * Renders the comment. `head` is null when this commit could not be
 * measured; `diff` is null when there is no baseline, and `baselineNote`
 * then says why. `gate` is the size gate's result, whose `kind` picks its
 * alert. `nativeChanges` is what `findNativeChanges` found, or null/absent for
 * none. `app` is the app size section from `buildAppSection`, or null for
 * none. `limit` caps the rendered length, dropping the collapsed tables past
 * it; `everyRow` lists unchanged rows in them too, for the job summary.
 */
export function renderComment(
	{head, diff, baselineNote, gate, nativeChanges = null, app = null},
	{limit = COMMENT_LIMIT, everyRow = false} = {},
) {
	let alerts = [
		...jsAlerts(gate, baselineNote, head === null ? null : diff),
		...nativeAlerts(nativeChanges),
		...appAlerts(app),
	].sort((a, b) => ALERT_ORDER.indexOf(a.type) - ALERT_ORDER.indexOf(b.type))
	let parts = head === null || diff === null ? [] : changeParts(diff, gate, app)
	let lines = [
		MARKER,
		headline({head, diff, nativeChanges}, alerts, parts),
		'',
		...alerts.flatMap(alertLines),
		...sizesTable(head, diff, app, parts.length > 0),
	]
	// A commit with no size report has only the app's figures to show.
	let measured = head === null ? null : diff
	let js = jsSection(measured, everyRow)
	let sections = [
		js,
		appSection(app, everyRow),
		depsSection(measured, everyRow),
		publishSection(measured, everyRow),
	]
	let small = footer({baselineNote, gate, app}, js)
	let full = [...lines, ...sections.flatMap(({top, tables}) => [...top, ...tables]), ...small]
	if (full.join('\n').length <= limit || sections.every(({tables}) => tables.length === 0)) {
		return full.join('\n')
	}
	return [
		...lines,
		...sections.flatMap(({top}) => top),
		"The full tables are in this run's job summary.",
		'',
		...small,
	].join('\n')
}
