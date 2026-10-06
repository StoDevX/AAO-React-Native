#!/usr/bin/env node
/**
 * The UI-test part of the pull request report.
 *
 * Each `ios.yml` shard writes what its result bundle holds (`shard`), a job
 * merges the shards' files into `uitest-report.json` (`merge`), and
 * `pr-report.yml` turns that and master's into a block of markdown (`render`)
 * that it splices into the report comment (`splice`, `extract`). The suite
 * outlasts the rest of the report, so the block arrives into a comment that is
 * already there.
 */

import {readdirSync, readFileSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'
import {parseArgs} from 'node:util'

import {collectDurations, readTestNodes} from '../collect-uitest-durations.mjs'
import {findFlakyTests} from '../report-flaky-uitests.mjs'

/** Bumped whenever `uitest-report.json`'s shape changes. */
export const UITEST_REPORT_VERSION = 1

/** The block's own markers, so it can be found and replaced inside the comment. */
export const BLOCK_START = '<!-- aao-uitest-report -->'
export const BLOCK_END = '<!-- /aao-uitest-report -->'

/** A test is listed as slower or faster when it moved by at least this many seconds... */
export const CHANGE_SECONDS = 5
/** ...and by at least this share of its time on master. */
export const CHANGE_RATIO = 0.25

const TOP_ROWS = 10
/** The collapsed table's rows, which keeps the block far under the comment limit. */
const MAX_ROWS = 50

/**
 * A test identifier as it may appear in the comment. The report comes from a
 * pull request's own run, so a name that could end a code span, start a link
 * or mention someone is dropped rather than escaped.
 */
const SAFE_IDENTIFIER = /^[\w./()-]{1,200}$/u

/** Whether `value` is a plain object, not an array or null. */
const isMap = (value) => typeof value === 'object' && value !== null && !Array.isArray(value)

/** Builds one shard's file from its result bundle's test tree. */
export function buildShard({shard, wallSeconds, testNodes}) {
	return {
		shard,
		wallSeconds,
		durations: collectDurations(testNodes),
		flaky: findFlakyTests(testNodes),
	}
}

/**
 * Merges the shards' files into `uitest-report.json`. A test runs in exactly
 * one shard, so durations don't collide. `result` is the suite's conclusion
 * (`success`, `failure`, …), `baseSha` the master commit a pull request was
 * based on, or null on a push to master.
 */
export function mergeShards(shards, {sha, baseSha, result}) {
	let ordered = [...shards].sort((a, b) => String(a.shard).localeCompare(String(b.shard)))
	return {
		version: UITEST_REPORT_VERSION,
		sha,
		baseSha,
		result,
		shards: Object.fromEntries(
			ordered.map((s) => [
				s.shard,
				{wallSeconds: s.wallSeconds, testCount: Object.keys(s.durations).length},
			]),
		),
		durations: Object.assign({}, ...ordered.map((s) => s.durations)),
		flaky: ordered.flatMap((s) => s.flaky).sort((a, b) => a.identifier.localeCompare(b.identifier)),
	}
}

/**
 * Reads a report, or returns null when there is none to read, as
 * `readVersioned` does in report.mjs. A report at another version is
 * returned unchecked, so the block can say the format changed; one at this
 * version has its figures checked and anything unsafe to print dropped.
 */
export function readUitestReport(path) {
	let parsed
	try {
		parsed = JSON.parse(readFileSync(path, 'utf8'))
	} catch {
		return null
	}
	if (typeof parsed !== 'object' || parsed === null || typeof parsed.version !== 'number') {
		return null
	}
	if (parsed.version !== UITEST_REPORT_VERSION) {
		return parsed
	}
	let {shards, durations, flaky} = parsed
	if (
		typeof parsed.sha !== 'string' ||
		typeof parsed.result !== 'string' ||
		!isMap(shards) ||
		!Object.values(shards).every(
			(s) => isMap(s) && Number.isFinite(s.wallSeconds) && Number.isFinite(s.testCount),
		) ||
		!isMap(durations) ||
		!Object.values(durations).every((seconds) => Number.isFinite(seconds)) ||
		!Array.isArray(flaky) ||
		!flaky.every((t) => isMap(t) && typeof t.identifier === 'string' && Number.isFinite(t.attempts))
	) {
		return null
	}
	return {
		...parsed,
		durations: Object.fromEntries(
			Object.entries(durations).filter(([name]) => SAFE_IDENTIFIER.test(name)),
		),
		flaky: flaky.filter((t) => SAFE_IDENTIFIER.test(t.identifier)),
	}
}

/**
 * Compares a pull request's tests with master's. Only tests both ran count
 * towards the totals and the rows: a pull request skips the chaos canaries
 * and the shards balance differently, so shard times and whole-suite totals
 * would differ for reasons no change made. A test moved when it differs by
 * `CHANGE_SECONDS` and `CHANGE_RATIO` of its time on master; rows come
 * biggest change first.
 */
export function diffUitests(baseline, head) {
	let common = Object.keys(head.durations).filter((name) => name in baseline.durations)
	let sum = (report) => common.reduce((total, name) => total + report.durations[name], 0)
	let rows = common
		.map((name) => {
			let before = baseline.durations[name]
			let after = head.durations[name]
			return {name, before, after, delta: after - before}
		})
		.filter(
			(row) =>
				Math.abs(row.delta) >= CHANGE_SECONDS && Math.abs(row.delta) >= CHANGE_RATIO * row.before,
		)
		.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || a.name.localeCompare(b.name))
	return {
		commonCount: common.length,
		before: sum(baseline),
		after: sum(head),
		rows,
		flakyOnBaseline: new Set(baseline.flaky.map((t) => t.identifier)),
	}
}

/** Seconds as `32s`, `9m 12s` or `1h 2m`. */
export function formatSeconds(seconds) {
	let total = Math.round(Math.abs(seconds))
	let sign = seconds < 0 ? '-' : ''
	if (total < 60) {
		return `${sign}${total}s`
	}
	if (total < 3600) {
		return `${sign}${Math.floor(total / 60)}m ${total % 60}s`
	}
	return `${sign}${Math.floor(total / 3600)}h ${Math.floor((total % 3600) / 60)}m`
}

/** A change in seconds with its sign: `+32s`, `-5s`, `0s`. */
const formatChange = (seconds) =>
	seconds > 0 ? `+${formatSeconds(seconds)}` : formatSeconds(seconds)

/** A test's time to a tenth of a second: `12.3 s`. */
const tenths = (seconds) => `${seconds.toFixed(1)} s`

/** `+19.4 s`, `-5.0 s`. */
const tenthsChange = (seconds) => (seconds > 0 ? `+${tenths(seconds)}` : tenths(seconds))

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`

/** One table row: a test's time before and after. */
const testRow = (row) =>
	`| \`${row.name}\` | ${tenths(row.before)} | ${tenths(row.after)} | ${tenthsChange(row.delta)} |`

/**
 * Renders the block. `baseline` is null with no usable comparison, and
 * `note` then says why; `diff` is `diffUitests`'s result, or null.
 */
export function renderBlock({head, diff, note}) {
	let shardList = Object.values(head.shards)
	let slowest = Math.max(0, ...shardList.map((s) => s.wallSeconds))
	let tests = shardList.reduce((total, s) => total + s.testCount, 0)
	let headline = `Slowest shard **${formatSeconds(slowest)}** · ${plural(tests, 'test')}, ${plural(shardList.length, 'shard')}`
	if (diff !== null) {
		headline += ` · test time ${formatSeconds(diff.after)} (master: ${formatSeconds(diff.before)} on the same ${diff.commonCount}, ${formatChange(diff.after - diff.before)})`
	}
	let lines = [BLOCK_START, '### UI tests', headline, '']
	if (head.result !== 'success') {
		lines.push(
			`The suite did not pass (${head.result}); these figures cover the tests that ran.`,
			'',
		)
	}
	if (head.flaky.length === 0) {
		lines.push('No test needed a retry.', '')
	} else {
		let flaky = head.flaky.map(
			(t) =>
				`\`${t.identifier}\` (${plural(t.attempts, 'attempt')}${diff?.flakyOnBaseline.has(t.identifier) ? ', also flaky on master' : ''})`,
		)
		lines.push(`Passed only after a retry (${head.flaky.length}): ${flaky.join(', ')}`, '')
	}
	if (note) {
		lines.push(note, '')
	}
	if (diff !== null && diff.rows.length > 0) {
		let header = [
			'| Slower or faster than master | Before | After | Δ |',
			'| --- | --- | --- | --- |',
		]
		lines.push(...header, ...diff.rows.slice(0, TOP_ROWS).map(testRow), '')
		if (diff.rows.length > TOP_ROWS) {
			let rest = diff.rows.slice(TOP_ROWS, MAX_ROWS)
			let more = diff.rows.length - TOP_ROWS - rest.length
			lines.push(
				'<details><summary>More tests that changed</summary>',
				'',
				...header,
				...rest.map(testRow),
				'',
				...(more > 0 ? [`…and ${more} more.`, ''] : []),
				'</details>',
				'',
			)
		}
	}
	lines.push(BLOCK_END)
	return lines.join('\n')
}

/**
 * The block for a head report and master's, with a note on what the
 * comparison is: none, an older format, or an older master commit.
 * `comparedSha` is the commit `baseline` came from.
 */
export function buildBlock({head, baseline, comparedSha}) {
	if (head === null) {
		return null
	}
	if (head.version !== UITEST_REPORT_VERSION) {
		return null
	}
	if (baseline === null) {
		return renderBlock({head, diff: null, note: 'No master UI-test report to compare with.'})
	}
	if (baseline.version !== UITEST_REPORT_VERSION) {
		return renderBlock({
			head,
			diff: null,
			note: `Baseline format changed (master's report is version ${baseline.version}), so there is nothing to compare.`,
		})
	}
	let note =
		comparedSha && head.baseSha && comparedSha !== head.baseSha
			? `Compared with master at \`${comparedSha.slice(0, 7)}\`, older than this PR's base \`${head.baseSha.slice(0, 7)}\`.`
			: null
	return renderBlock({head, diff: diffUitests(baseline, head), note})
}

/** The block inside `comment`, or null when it has none. */
export function extractBlock(comment) {
	let start = comment.indexOf(BLOCK_START)
	let end = comment.indexOf(BLOCK_END, start)
	if (start === -1 || end === -1) {
		return null
	}
	return comment.slice(start, end + BLOCK_END.length)
}

/**
 * `comment` with its block replaced by `block`, or with `block` added at the
 * end when it has none. A null `block` leaves the comment as it is.
 */
export function spliceBlock(comment, block) {
	if (block === null) {
		return comment
	}
	let existing = extractBlock(comment)
	if (existing !== null) {
		return comment.replace(existing, () => block)
	}
	return `${comment.replace(/\n+$/u, '')}\n\n${block}\n`
}

function mainShard(args) {
	let {values, positionals} = parseArgs({
		args,
		allowPositionals: true,
		options: {shard: {type: 'string'}, started: {type: 'string'}},
	})
	let [bundle, out] = positionals
	let now = Math.floor(Date.now() / 1000)
	let started = Number(values.started)
	let testNodes = []
	try {
		testNodes = readTestNodes(bundle)
	} catch (error) {
		// A step that times out leaves no bundle; its time still counts.
		console.log(`Could not read ${bundle}: ${error.message}`)
	}
	let shard = buildShard({
		shard: values.shard,
		wallSeconds: Number.isFinite(started) && started > 0 ? now - started : 0,
		testNodes,
	})
	writeFileSync(out, `${JSON.stringify(shard, null, '\t')}\n`)
}

function mainMerge(args) {
	let {values, positionals} = parseArgs({
		args,
		allowPositionals: true,
		options: {sha: {type: 'string'}, 'base-sha': {type: 'string'}, result: {type: 'string'}},
	})
	let [dir, out] = positionals
	let shards = readdirSync(dir, {recursive: true})
		.filter((name) => name.endsWith('uitest-shard.json'))
		.map((name) => JSON.parse(readFileSync(join(dir, name), 'utf8')))
	if (shards.length === 0) {
		console.log('No shard reports; the suite did not run.')
		return
	}
	let report = mergeShards(shards, {
		sha: values.sha,
		baseSha: values['base-sha'] || null,
		result: values.result,
	})
	writeFileSync(out, `${JSON.stringify(report, null, '\t')}\n`)
}

function mainRender(args) {
	let {values} = parseArgs({
		args,
		options: {
			head: {type: 'string'},
			baseline: {type: 'string'},
			'compared-sha': {type: 'string'},
			out: {type: 'string'},
		},
	})
	let block = buildBlock({
		head: readUitestReport(values.head),
		baseline: readUitestReport(values.baseline),
		comparedSha: values['compared-sha'],
	})
	if (block === null) {
		console.log('No UI-test report to render.')
		return
	}
	writeFileSync(values.out, `${block}\n`)
}

/** `splice <comment> <block>` prints the comment with the block in it; `extract <comment>` prints its block. */
function mainComment(command, args) {
	let comment = readFileSync(args[0], 'utf8')
	if (command === 'extract') {
		let block = extractBlock(comment)
		if (block !== null) {
			process.stdout.write(`${block}\n`)
		}
		return
	}
	let block = readFileSync(args[1], 'utf8').trim()
	process.stdout.write(spliceBlock(comment, block === '' ? null : block))
}

function main() {
	let [command, ...args] = process.argv.slice(2)
	let commands = {
		shard: mainShard,
		merge: mainMerge,
		render: mainRender,
		splice: (rest) => mainComment('splice', rest),
		extract: (rest) => mainComment('extract', rest),
	}
	if (!(command in commands)) {
		console.error('usage: uitest-report.mjs shard|merge|render|splice|extract …')
		process.exit(2)
	}
	commands[command](args)
}

if (import.meta.main) {
	main()
}
