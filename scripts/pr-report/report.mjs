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
import {findNativeChanges} from './native-changes.mjs'
import {renderComment} from './render.mjs'
import {APP_SIZE_VERSION, REPORT_VERSION} from './report-version.mjs'

/**
 * Exit code for a failed size gate. Any other non-zero code is a crash, which
 * node reports as 1, so the workflow can tell the two apart.
 */
export const GATE_FAILED_EXIT_CODE = 2

/**
 * Reads a JSON report, or returns null when there is none to read. A
 * download that failed or expired leaves no file, or a file that is not a
 * report, and both mean the same thing here: nothing to compare. A report at
 * `version` is also checked with `isMalformed`, so a half-written or
 * corrupted upload reads as missing rather than crashing the comparison; a
 * report at another version is returned unchecked, so the comment can say
 * the format changed.
 */
function readVersioned(path, version, isMalformed) {
	let parsed
	try {
		parsed = JSON.parse(readFileSync(path, 'utf8'))
	} catch {
		return null
	}
	if (typeof parsed !== 'object' || parsed === null || typeof parsed.version !== 'number') {
		return null
	}
	if (parsed.version === version && isMalformed(parsed)) {
		return null
	}
	return parsed
}

/**
 * Reads a size report, as `readVersioned` does, checking the JS, asset and
 * dependency shapes this script reads.
 */
export function readReport(path) {
	return readVersioned(
		path,
		REPORT_VERSION,
		({js, deps}) =>
			typeof js !== 'object' ||
			js === null ||
			!Number.isFinite(js.hermesBytes) ||
			!Number.isFinite(js.assetsBytes) ||
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
			),
	)
}

/** Whether `value` is a plain object whose values are all finite numbers. */
function isByteMap(value) {
	return (
		typeof value === 'object' &&
		value !== null &&
		!Array.isArray(value) &&
		Object.values(value).every((bytes) => Number.isFinite(bytes))
	)
}

/**
 * Reads an app report, as `readVersioned` does, checking the figures and
 * maps this script reads.
 */
export function readAppReport(path) {
	return readVersioned(
		path,
		APP_SIZE_VERSION,
		(report) =>
			!(
				typeof report.measuredSha === 'string' &&
				typeof report.device === 'string' &&
				Number.isFinite(report.installBytes) &&
				Number.isFinite(report.downloadBytes) &&
				isByteMap(report.byGroup) &&
				isByteMap(report.byAsset)
			),
	)
}

/** The failed result for a commit with no usable size report. */
function unreadable(nativeChanges) {
	let gate = {
		pass: false,
		message: 'No size report for this commit, so the size gate cannot pass.',
	}
	let empty = {head: null, diff: null, baselineNote: null, gate, nativeChanges}
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
export function buildPrReport({head, baseline, comparedSha, baseRef, labels, limit, files = []}) {
	// A dependency change can only be told from the two reports; the files
	// need neither, so the notice still shows the changes it can find.
	let nativeChanges = (diff) => findNativeChanges({files, packageChanges: diff?.deps.changes ?? []})
	if (head === null) {
		return unreadable(nativeChanges(null))
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
	let full = {head, diff, baselineNote, gate, nativeChanges: nativeChanges(diff)}
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
			files: {type: 'string'},
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
		files: JSON.parse(readFileSync(values.files, 'utf8')),
	})
	writeFileSync(values['comment-out'], comment)
	writeFileSync(values['summary-out'], summary)
	process.exitCode = pass ? 0 : GATE_FAILED_EXIT_CODE
}

if (import.meta.main) {
	main()
}
