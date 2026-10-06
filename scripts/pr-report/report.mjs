#!/usr/bin/env node
/**
 * Build the pull request report from this commit's size report and
 * master's, write its markdown, and exit with GATE_FAILED_EXIT_CODE when the
 * size gate fails.
 */

import {readFileSync, writeFileSync} from 'node:fs'
import {parseArgs} from 'node:util'

import {diffApp, diffReports} from './diff.mjs'
import {APP_GATE_ENFORCED, APP_GROWTH_LIMIT_BYTES, decideAppGate, decideGate} from './gate.mjs'
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
				typeof report.sha === 'string' &&
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
function unreadable(nativeChanges, app) {
	let gate = {
		pass: false,
		message: 'No size report for this commit, so the size gate cannot pass.',
	}
	let empty = {head: null, diff: null, baselineNote: null, gate, nativeChanges, app}
	return {comment: renderComment(empty), summary: renderComment(empty, Infinity), pass: false}
}

/** What a size report's JS adds to the app: its bytecode and bundled images. */
const jsBytes = (report) => report.js.hermesBytes + report.js.assetsBytes

/**
 * The app size section, or null when there is nothing to show: no native
 * change and no baseline. `needed` is whether this PR changed native paths;
 * `appHead` is its app report (null when it did not archive, or the archive
 * failed); `appBaseline` is the base branch's, whose `sha` is the commit it
 * stands for and `measuredSha` the one that archived. `head` and `baseline` are the
 * size reports, whose JS completes the total; `baseline` is null unless it
 * is the current version. `runUrl` is where to find the App size job, which
 * the section links when there is no measurement: this run, or on a label
 * change, which archives nothing, the pull request's checks.
 */
export function buildAppSection({
	needed,
	appHead,
	appBaseline,
	head,
	baseline,
	labels,
	appLimit = APP_GROWTH_LIMIT_BYTES,
	appEnforced = APP_GATE_ENFORCED,
	runUrl,
}) {
	let notes = []
	let usable = null
	if (appBaseline === null) {
		if (needed && appHead !== null) {
			notes.push('No app size for the base branch to compare with.')
		}
	} else if (appBaseline.version !== APP_SIZE_VERSION) {
		if (needed && appHead !== null) {
			notes.push(
				`Baseline app size format changed (version ${appBaseline.version}), so there is nothing to compare.`,
			)
		}
	} else {
		usable = appBaseline
		if (usable.measuredSha !== usable.sha) {
			notes.push(
				`The base branch's native figures were measured at \`${usable.measuredSha.slice(0, 7)}\` and carried forward.`,
			)
		}
	}
	if (!needed && usable === null) {
		return null
	}

	let diff = needed && appHead !== null && usable !== null ? diffApp(usable, appHead) : null
	let native = needed ? appHead?.installBytes : usable.installBytes
	let total = null
	if (native !== undefined && head !== null) {
		let after = native + jsBytes(head)
		if (usable !== null && baseline !== null) {
			let before = usable.installBytes + jsBytes(baseline)
			total = {name: 'total', before, after, delta: after - before}
		} else {
			total = {after}
		}
	}

	let gate
	if (!needed) {
		gate = {pass: true, warn: false, message: ''}
	} else if (appHead === null) {
		gate = appEnforced
			? {
					pass: false,
					warn: false,
					message: 'No app size for this commit, so the app size gate cannot pass.',
				}
			: {
					pass: true,
					warn: true,
					message:
						'No app size for this commit; the app size gate will fail this once it is enforced.',
				}
	} else if (diff !== null && head !== null && usable.sha !== head.baseSha) {
		gate = {
			pass: true,
			warn: false,
			message: 'Compared with an older master commit, so the app size gate passes.',
		}
	} else {
		gate = decideAppGate({
			install: diff?.install ?? null,
			labels,
			limit: appLimit,
			enforced: appEnforced,
		})
	}

	return {
		needed,
		head: appHead,
		baseline: usable,
		diff,
		total,
		note: notes.length > 0 ? notes.join(' ') : null,
		runUrl,
		gate,
	}
}

/**
 * Builds the comment, the job summary and the gate result from this
 * commit's report and its base branch's. `head.baseSha` is the base branch
 * commit this PR is based on; `comparedSha` is the commit `baseline`
 * actually came from. For master that can be an older ancestor when there is
 * no report for `head.baseSha` itself (still running, cancelled, expired);
 * for any other base branch it is `head.baseSha` or there is no baseline.
 * `appNeeded`, `appHead`, `appBaseline` and `runUrl` feed the app size section, as
 * `buildAppSection` describes; either gate failing fails the report.
 */
export function buildPrReport({
	head,
	baseline,
	comparedSha,
	baseRef,
	labels,
	limit,
	files = [],
	appNeeded = false,
	appHead = null,
	appBaseline = null,
	appLimit,
	appEnforced,
	runUrl,
}) {
	// A dependency change can only be told from the two reports; the files
	// need neither, so the notice still shows the changes it can find.
	let nativeChanges = (diff) => findNativeChanges({files, packageChanges: diff?.deps.changes ?? []})
	let app = buildAppSection({
		needed: appNeeded,
		appHead,
		appBaseline,
		head,
		baseline: baseline?.version === REPORT_VERSION ? baseline : null,
		labels,
		appLimit,
		appEnforced,
		runUrl,
	})
	if (head === null) {
		return unreadable(nativeChanges(null), app)
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
	let full = {head, diff, baselineNote, gate, nativeChanges: nativeChanges(diff), app}
	return {
		comment: renderComment(full),
		summary: renderComment(full, Infinity),
		pass: gate.pass && (app?.gate.pass ?? true),
	}
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
			'app-needed': {type: 'string'},
			'app-head': {type: 'string'},
			'app-baseline': {type: 'string'},
			'run-url': {type: 'string'},
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
		// A path that is absent, because no archive ran or none was found,
		// reads as null.
		appNeeded: values['app-needed'] === 'true',
		appHead: readAppReport(values['app-head']),
		appBaseline: readAppReport(values['app-baseline']),
		runUrl: values['run-url'],
	})
	writeFileSync(values['comment-out'], comment)
	writeFileSync(values['summary-out'], summary)
	process.exitCode = pass ? 0 : GATE_FAILED_EXIT_CODE
}

if (import.meta.main) {
	main()
}
