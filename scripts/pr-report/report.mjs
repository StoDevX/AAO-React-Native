#!/usr/bin/env node
/**
 * Build the pull request report from this commit's size report and
 * master's, write its markdown, and exit with GATE_FAILED_EXIT_CODE when the
 * size gate fails.
 */

import {readFileSync, writeFileSync} from 'node:fs'
import {parseArgs} from 'node:util'

import {diffReports} from './diff.mjs'
import {decideGate} from './gate.mjs'
import {renderComment} from './render.mjs'
import {REPORT_VERSION} from './report-version.mjs'

/**
 * Exit code for a failed size gate. Any other non-zero code is a crash, which
 * node reports as 1, so the workflow can tell the two apart.
 */
export const GATE_FAILED_EXIT_CODE = 2

/**
 * Reads a size report, or returns null when there is none to read. A
 * download that failed or expired leaves no file, or a file that is not a
 * report, and both mean the same thing here: nothing to compare. A report at
 * the current version is also checked for the JS and dependency shapes this script reads,
 * so a half-written or corrupted upload reads as missing rather than
 * crashing the comparison.
 */
export function readReport(path) {
	let parsed
	try {
		parsed = JSON.parse(readFileSync(path, 'utf8'))
	} catch {
		return null
	}
	if (typeof parsed !== 'object' || parsed === null || typeof parsed.version !== 'number') {
		return null
	}
	if (parsed.version === REPORT_VERSION) {
		let js = parsed.js
		let deps = parsed.deps
		if (
			typeof js !== 'object' ||
			js === null ||
			!Number.isFinite(js.hermesBytes) ||
			typeof js.byPackage !== 'object' ||
			js.byPackage === null ||
			typeof js.byFeature !== 'object' ||
			js.byFeature === null ||
			typeof deps !== 'object' ||
			deps === null ||
			!Number.isFinite(deps.nodeModulesBytes) ||
			typeof deps.packages !== 'object' ||
			deps.packages === null ||
			Array.isArray(deps.packages) ||
			!Object.values(deps.packages).every(
				(versions) => Array.isArray(versions) && versions.every((v) => typeof v === 'string'),
			) ||
			typeof deps.sizes !== 'object' ||
			deps.sizes === null ||
			Array.isArray(deps.sizes) ||
			!Object.values(deps.sizes).every(
				(size) =>
					typeof size === 'object' &&
					size !== null &&
					Number.isFinite(size.installed) &&
					Number.isFinite(size.bundled),
			)
		) {
			return null
		}
	}
	return parsed
}

/** The failed result for a commit with no usable size report. */
function unreadable() {
	let gate = {
		pass: false,
		message: 'No size report for this commit, so the size gate cannot pass.',
	}
	let empty = {head: null, diff: null, baselineNote: null, gate}
	return {comment: renderComment(empty), summary: renderComment(empty, Infinity), pass: false}
}

/**
 * Builds the comment, the job summary and the gate result from this
 * commit's report and its base branch's. `head.baseSha` is the base branch
 * commit this PR is based on; `comparedSha` is the commit `baseline`
 * actually came from. For master that can be an older ancestor when there is
 * no report for `head.baseSha` itself (still running, cancelled, expired);
 * for any other base branch it is `head.baseSha` or there is no baseline.
 */
export function buildPrReport({head, baseline, comparedSha, baseRef, labels, limit}) {
	if (head === null) {
		return unreadable()
	}

	let short = head.baseSha ? head.baseSha.slice(0, 7) : 'none'
	let baselineNote = null
	let diff = null
	// How the notes name the base branch: master plainly, any other branch (a
	// PR stacked on another) in code style.
	let branch = baseRef === 'master' ? 'master' : `\`${baseRef}\``
	if (baseline === null) {
		baselineNote =
			baseRef === 'master'
				? `No master report at or before \`${short}\`.`
				: `No report for ${branch} at \`${short}\`.`
	} else if (baseline.version !== REPORT_VERSION) {
		// Name the commit the baseline actually came from, which can be an
		// older ancestor than the PR's base (`short`) when find-baseline.sh
		// fell back to one.
		let comparedShort = (comparedSha || head.baseSha)?.slice(0, 7) ?? 'none'
		baselineNote = `Baseline format changed (${branch}'s report for \`${comparedShort}\` is version ${baseline.version}), so there is nothing to compare.`
	} else {
		diff = diffReports(baseline, head)
		if (comparedSha !== head.baseSha) {
			let comparedShort = comparedSha.slice(0, 7)
			baselineNote = `Compared with ${branch} at \`${comparedShort}\`, older than this PR's base \`${short}\`: growth merged in between is counted here.`
		} else if (baseRef !== 'master') {
			baselineNote = `Compared with ${branch}, this PR's base branch, at \`${short}\`.`
		}
	}

	// A fallback baseline counts growth other PRs merged in between, which
	// this PR did not add, so it is shown but never gates.
	let gate =
		diff !== null && comparedSha !== head.baseSha
			? {pass: true, message: 'Compared with an older master commit, so the size gate passes.'}
			: decideGate({hermes: diff?.hermes ?? null, labels, limit})
	let full = {head, diff, baselineNote, gate}
	return {comment: renderComment(full), summary: renderComment(full, Infinity), pass: gate.pass}
}

function main() {
	let {values} = parseArgs({
		options: {
			head: {type: 'string'},
			baseline: {type: 'string'},
			'compared-sha': {type: 'string'},
			'base-ref': {type: 'string'},
			labels: {type: 'string'},
			'comment-out': {type: 'string'},
			'summary-out': {type: 'string'},
		},
	})
	let labels = JSON.parse(readFileSync(values.labels, 'utf8'))
	let {comment, summary, pass} = buildPrReport({
		head: readReport(values.head),
		baseline: readReport(values.baseline),
		comparedSha: values['compared-sha'],
		baseRef: values['base-ref'],
		labels,
	})
	writeFileSync(values['comment-out'], comment)
	writeFileSync(values['summary-out'], summary)
	process.exitCode = pass ? 0 : GATE_FAILED_EXIT_CODE
}

if (import.meta.main) {
	main()
}
