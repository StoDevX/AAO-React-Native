#!/usr/bin/env node
/**
 * Replay merged pull requests through the UI-test selector, to measure what
 * it would have saved before CI relies on it.
 *
 * Each PR's import graph is built at its merge commit, read straight from
 * git. The Routes markers and test durations are today's, since older
 * commits have no markers; the report says so.
 */

import {execFileSync} from 'node:child_process'
import {readFileSync, writeFileSync} from 'node:fs'

import {discoverTests, packShards, weighMethods} from './split-uitests.mjs'
import {selectUITests} from './uitests-selection.mjs'

const REPO = 'StoDevX/AAO-React-Native'
const DEPENDENCY_FILE =
	/^(package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|mise\.(toml|lock)|modules\/[^/]+\/package\.json)$/u
const TOOLING_FILE =
	/^(\.github\/|scripts\/|\.mise\/|mise\.(toml|lock)$|\.claude\/|docs\/|[^/]+\.md$)/u

/** Whether a PR is dependency upkeep, CI and tooling, or work on the app. */
export function kindOf({author, files}) {
	if (/renovate/u.test(author) || files.every((file) => DEPENDENCY_FILE.test(file))) {
		return 'dependency'
	}
	if (files.every((file) => TOOLING_FILE.test(file))) return 'tooling'
	return 'feature'
}

/** The slower of two shards packed from the selected classes; null selects every class. */
export function estimateSeconds(classNames, classes, durations) {
	const chosen =
		classNames === null ? classes : classes.filter((found) => classNames.includes(found.className))
	if (chosen.length === 0) return 0
	const shards = packShards(weighMethods(chosen, durations), 2)
	return Math.max(...shards.map((shard) => shard.reduce((total, item) => total + item.weight, 0)))
}

/**
 * `Class/method` for every test whose last attempt in a CI job log failed.
 *
 * The job log is formatted: a test's class is the suite last started, a pass
 * is `✔ testName (…)`, and a failed attempt is `##[error]    testName, …`.
 * A retry that passes follows the failure, so the last line for a test wins.
 */
export function failedTests(log) {
	const last = new Map()
	let suite = null
	for (const raw of log.split('\n')) {
		// The log colours its marks with ANSI escapes.
		// oxlint-disable-next-line no-control-regex
		const line = raw.replaceAll(/\u001B\[[0-9;]*m/gu, '')
		const started = line.match(/Test Suite '(\w+)' started/u)
		const passed = line.match(/✔ (test\w+) \(/u)
		const failed = line.match(/##\[error\]\s+(test\w+),/u)
		if (started) suite = started[1]
		else if (suite && passed) last.set(`${suite}/${passed[1]}`, 'passed')
		else if (suite && failed) last.set(`${suite}/${failed[1]}`, 'failed')
	}
	return [...last].filter(([, status]) => status === 'failed').map(([name]) => name)
}

/** The value at a fraction through a sorted list, by nearest rank. */
function quantile(sorted, fraction) {
	return sorted[Math.max(0, Math.ceil(fraction * sorted.length) - 1)]
}

function savings(rows) {
	const sorted = rows.map((row) => 1 - row.selected / row.full).sort((a, b) => a - b)
	return {count: rows.length, median: quantile(sorted, 0.5), p75: quantile(sorted, 0.75)}
}

/** Saving by kind, the commonest reasons everything ran, and PRs selection would have let a failure through. */
export function summarize(rows) {
	const byKind = {}
	for (const kind of new Set(rows.map((row) => row.kind))) {
		byKind[kind] = savings(rows.filter((row) => row.kind === kind))
	}
	const forced = new Map()
	for (const row of rows.filter((candidate) => candidate.all)) {
		forced.set(row.reason, (forced.get(row.reason) ?? 0) + 1)
	}
	const missed = rows.filter(
		(row) => !row.all && row.failed.some((test) => !row.classes.includes(test.split('/')[0])),
	)
	return {
		byKind,
		all: savings(rows),
		forcedBy: [...forced].sort((a, b) => b[1] - a[1]).slice(0, 5),
		missed,
	}
}

const BIG = 1 << 28

/** A commit's tree, read from git without a checkout. */
function gitTree(commit) {
	const files = execFileSync('git', ['ls-tree', '-r', '--name-only', commit], {
		encoding: 'utf8',
		maxBuffer: BIG,
	})
		.split('\n')
		.filter(Boolean)
	const cache = new Map()
	return {
		list: () => files,
		read: (path) => {
			if (!cache.has(path)) {
				cache.set(
					path,
					execFileSync('git', ['show', `${commit}:${path}`], {encoding: 'utf8', maxBuffer: BIG}),
				)
			}
			return cache.get(path)
		},
	}
}

const gh = (args) =>
	execFileSync('gh', ['api', '--allow-escape-sequences', ...args], {
		encoding: 'utf8',
		maxBuffer: BIG,
	})
const ghPages = (path) => JSON.parse(gh(['--paginate', '--slurp', path]))

/** Failed UI tests across every iOS workflow run on a PR's branch. */
function failedOnBranch(branch) {
	const runs = ghPages(
		`repos/${REPO}/actions/workflows/ios.yml/runs?branch=${encodeURIComponent(branch)}&event=pull_request&per_page=100`,
	).flatMap((page) => page.workflow_runs)
	const failed = new Set()
	for (const run of runs) {
		const jobs = ghPages(`repos/${REPO}/actions/runs/${run.id}/jobs?per_page=100`).flatMap(
			(page) => page.jobs,
		)
		for (const job of jobs) {
			if (!job.name.startsWith('Native UITest') || job.conclusion !== 'failure') continue
			try {
				for (const test of failedTests(gh([`repos/${REPO}/actions/jobs/${job.id}/logs`]))) {
					failed.add(test)
				}
			} catch {
				// GitHub keeps job logs for a limited time.
				failed.add('(log expired)/unknown')
			}
		}
	}
	return [...failed]
}

const isUITest = (file) => file.startsWith('uitests/')

/** The tree selectUITests reads for a past PR: its own app code, today's UI tests and markers. */
function replayTree(merged, today) {
	const files = [
		...merged.list().filter((file) => !isUITest(file)),
		...today.list().filter(isUITest),
	]
	return {list: () => files, read: (path) => (isUITest(path) ? today : merged).read(path)}
}

function main() {
	const [since, durationsPath] = process.argv.slice(2)
	if (!since || !durationsPath) {
		console.error('usage: replay-uitests-selection.mjs <YYYY-MM-DD> <durations.json>')
		process.exit(1)
	}
	const durations = JSON.parse(readFileSync(durationsPath, 'utf8'))

	const today = gitTree('HEAD')
	const swift = today
		.list()
		.filter(
			(file) =>
				file.startsWith('uitests/') &&
				file.endsWith('.swift') &&
				!file.startsWith('uitests/Chaos/'),
		)
	const classes = discoverTests(swift.map((name) => ({name, text: today.read(name)})))
	const full = estimateSeconds(null, classes, durations)

	const prs = JSON.parse(
		execFileSync(
			'gh',
			[
				'pr',
				'list',
				'--repo',
				REPO,
				'--state',
				'merged',
				'--search',
				`merged:>=${since}`,
				'--limit',
				'400',
				'--json',
				'number,author,headRefName,mergeCommit,files',
			],
			{encoding: 'utf8', maxBuffer: BIG},
		),
	)

	const rows = []
	for (const pr of prs) {
		const files = pr.files.map((file) => file.path)
		let result
		if (files.length >= 100) {
			// gh lists at most 100 files a PR, so a longer list may be missing
			// the one file that matters.
			result = {all: true, reason: 'gh truncates a list of 100 files or more'}
		} else {
			try {
				result = selectUITests({
					changedFiles: files,
					tree: replayTree(gitTree(pr.mergeCommit.oid), today),
				})
			} catch (error) {
				// A marker naming a route the PR's tree did not have yet lands here.
				result = {all: true, reason: `selector threw: ${error.message.split('\n')[0]}`}
			}
		}
		const chosen = result.all ? null : [...result.classes.keys()]
		const row = {
			number: pr.number,
			kind: kindOf({author: pr.author.login, files}),
			all: result.all,
			reason: result.all ? result.reason : '',
			classes: chosen ?? [],
			selected: estimateSeconds(chosen, classes, durations),
			full,
			failed: failedOnBranch(pr.headRefName),
		}
		rows.push(row)
		console.error(
			`#${row.number} ${row.kind}: ${row.all ? `all (${row.reason})` : row.classes.join(' ') || 'none'}`,
		)
	}

	writeFileSync('replay-rows.json', JSON.stringify(rows, null, '\t'))
	console.log(JSON.stringify(summarize(rows), null, '\t'))
}

if (import.meta.main) {
	main()
}
