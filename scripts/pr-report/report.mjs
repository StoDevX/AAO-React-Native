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
import {REPORT_VERSION} from './js-size.mjs'
import {renderComment} from './render.mjs'

/**
 * Exit code for a failed size gate. Any other non-zero code is a crash, which
 * node reports as 1, so the workflow can tell the two apart.
 */
export const GATE_FAILED_EXIT_CODE = 2

/**
 * Reads a size report, or returns null when there is none to read. A
 * download that failed or expired leaves no file, or a file that is not a
 * report, and both mean the same thing here: nothing to compare. A report at
 * the current version is also checked for the JS shape this script reads,
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
		if (
			typeof js !== 'object' ||
			js === null ||
			!Number.isFinite(js.hermesBytes) ||
			typeof js.byPackage !== 'object' ||
			js.byPackage === null ||
			typeof js.byFeature !== 'object' ||
			js.byFeature === null
		) {
			return null
		}
	}
	return parsed
}

/**
 * Builds the comment, the job summary and the gate result from this
 * commit's report and master's. `head.baseSha` is the master commit this PR
 * is based on; `comparedSha` is the master commit `baseline` actually came
 * from, which can be an older ancestor when there is no report for
 * `head.baseSha` itself (still running, cancelled, expired). `baseRef` is
 * the PR's base branch: only `master` has a baseline to compare with.
 */
export function buildPrReport({head, baseline, comparedSha, baseRef, labels, limit}) {
	if (head === null) {
		let gate = {
			pass: false,
			message: 'No size report for this commit, so the size gate cannot pass.',
		}
		let empty = {head, diff: null, baselineNote: null, gate}
		return {comment: renderComment(empty), summary: renderComment(empty, Infinity), pass: false}
	}

	let short = head.baseSha ? head.baseSha.slice(0, 7) : 'none'
	let baselineNote = null
	let diff = null
	if (baseRef !== 'master') {
		baselineNote = `No comparison: this PR is based on \`${baseRef}\`, not master.`
	} else if (baseline === null) {
		baselineNote = `No master report at or before \`${short}\`.`
	} else if (baseline.version !== REPORT_VERSION) {
		// Name the commit the baseline actually came from, which can be an
		// older ancestor than the PR's base (`short`) when find-baseline.sh
		// fell back to one.
		let comparedShort = (comparedSha || head.baseSha)?.slice(0, 7) ?? 'none'
		baselineNote = `Baseline format changed (master's report for \`${comparedShort}\` is version ${baseline.version}), so there is nothing to compare.`
	} else {
		diff = diffReports(baseline, head)
		if (comparedSha !== head.baseSha) {
			let comparedShort = comparedSha.slice(0, 7)
			baselineNote = `Compared with master at \`${comparedShort}\`, older than this PR's base \`${short}\`: growth merged in between is counted here.`
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
