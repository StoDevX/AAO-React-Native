#!/usr/bin/env node
/**
 * Build the pull request report from this commit's size report and
 * master's, write its markdown, and exit non-zero when the size gate fails.
 */

import {readFileSync, writeFileSync} from 'node:fs'

import {diffReports} from './diff.mjs'
import {decideGate} from './gate.mjs'
import {REPORT_VERSION} from './js-size.mjs'
import {renderComment} from './render.mjs'

/**
 * Reads a size report, or returns null when there is none to read. A
 * download that failed or expired leaves no file, or a file that is not a
 * report, and both mean the same thing here: nothing to compare.
 */
export function readReport(path) {
	try {
		return JSON.parse(readFileSync(path, 'utf8'))
	} catch {
		return null
	}
}

/** Builds the comment and gate result from the two reports. */
export function buildPrReport({head, baseline, baseSha, labels, limit}) {
	let short = baseSha.slice(0, 7)
	if (head === null) {
		let gate = {
			pass: false,
			message: 'No size report for this commit, so the size gate cannot pass.',
		}
		return {markdown: renderComment({head, diff: null, baselineNote: null, gate}), pass: false}
	}
	let baselineNote = null
	if (baseline === null) {
		baselineNote = `No baseline for \`${short}\`: master's report for it is missing or expired.`
	} else if (baseline.version !== REPORT_VERSION) {
		baselineNote = `Baseline format changed (master's report for \`${short}\` is version ${baseline.version}), so there is nothing to compare.`
	}
	let diff = baselineNote === null ? diffReports(baseline, head) : null
	let gate = decideGate({hermes: diff?.hermes ?? null, labels, limit})
	return {markdown: renderComment({head, diff, baselineNote, gate}), pass: gate.pass}
}

function main() {
	let [headPath, baselinePath, baseSha, labelsPath, outPath] = process.argv.slice(2)
	let labels = JSON.parse(readFileSync(labelsPath, 'utf8'))
	let {markdown, pass} = buildPrReport({
		head: readReport(headPath),
		baseline: readReport(baselinePath),
		baseSha,
		labels,
	})
	writeFileSync(outPath, markdown)
	process.exitCode = pass ? 0 : 1
}

if (import.meta.main) {
	main()
}
