#!/usr/bin/env node

// Summarises the stopping findings of every chaos run under a directory, one
// entry per distinct bug, for the nightly job's summary: what the app wrote
// to chaos-findings.jsonl, and what stopped the monkey, from outcome.json.

import {existsSync, readdirSync, readFileSync} from 'node:fs'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'

import {stoppingFindings} from './chaos-run.mjs'

/** A stack's first frame, which with the message identifies a bug. */
export function topFrame(stack) {
	return (
		stack
			?.split('\n')
			.find((part) => part.trim().startsWith('at '))
			?.trim() ?? ''
	)
}

/** A JS stop reason, as the monkey records a beacon reading of `kind: message`. */
const JS_STOP = /^js: ([\w-]+): (.*)$/u

/**
 * Whether `stopReason` just repeats a finding the app already wrote to its
 * own findings file -- the monkey's `js: <kind>: <message>` reading of the
 * beacon names the very finding `findings` lists, so counting it again would
 * list the same bug twice under two kinds.
 */
function restatesAFinding(stopReason, findings) {
	let match = JS_STOP.exec(stopReason ?? '')
	if (!match) return false
	let [, kind, message] = match
	return findings.some((finding) => finding.kind === kind && finding.message === message)
}

/**
 * Each distinct stopping finding across runs, with the seeds that found it.
 * A run's `stopReason` -- a native crash, a hang, an error screen -- is
 * one of its own kind, since the app never saw it to write it down. A JS
 * stop reason is different: it is the monkey's own reading of the beacon,
 * which already names a finding the app wrote to chaos-findings.jsonl.
 */
export function dedupeFindings(runs) {
	let byKey = new Map()
	let add = (seed, kind, message, frame) => {
		let key = `${kind}\n${message}\n${frame}`
		let entry = byKey.get(key) ?? {kind, message, frame, seeds: []}
		if (!entry.seeds.includes(seed)) entry.seeds.push(seed)
		byKey.set(key, entry)
	}
	for (let {seed, lines, stopReason} of runs) {
		let findings = stoppingFindings(lines)
		for (let finding of findings) {
			add(seed, finding.kind, finding.message, topFrame(finding.stack))
		}
		if (stopReason && !restatesAFinding(stopReason, findings)) add(seed, 'stop', stopReason, '')
	}
	return [...byKey.values()]
}

/** The findings as the job summary's Markdown. */
export function renderSummary(findings) {
	if (findings.length === 0) {
		return '## Chaos\n\nNo stopping findings.\n'
	}
	let rows = findings.map(
		(f) =>
			`- **${f.kind}**: ${f.message}${f.frame ? ` \`${f.frame}\`` : ''} — seeds ${f.seeds.join(', ')}; replay with \`mise run chaos -- --replay logs/chaos/${f.seeds[0]}\``,
	)
	return `## Chaos\n\n${rows.join('\n')}\n`
}

/** Each run under `root`, named by its directory; none when `root` is missing. */
function readRuns(root) {
	if (!existsSync(root)) return []
	let read = (dir, file) =>
		existsSync(join(root, dir, file)) ? readFileSync(join(root, dir, file), 'utf8') : null
	return readdirSync(root)
		.filter(
			(dir) =>
				existsSync(join(root, dir, 'chaos-findings.jsonl')) ||
				existsSync(join(root, dir, 'outcome.json')),
		)
		.map((dir) => {
			let outcome = read(dir, 'outcome.json')
			return {
				seed: dir,
				lines: (read(dir, 'chaos-findings.jsonl') ?? '').split('\n'),
				stopReason: outcome ? JSON.parse(outcome).stopReason : null,
			}
		})
}

/** The job summary for every chaos run under `root`. */
export function summarise(root) {
	let runs = readRuns(root)
	if (runs.length === 0) {
		return '## Chaos\n\nNo chaos run produced results.\n'
	}
	return renderSummary(dedupeFindings(runs))
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	process.stdout.write(summarise(process.argv[2] ?? 'logs/chaos'))
}
