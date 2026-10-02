#!/usr/bin/env node

// Summarises the stopping findings of every chaos run under a directory, one
// entry per distinct bug, for the nightly job's summary.

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

/** Each distinct stopping finding across runs, with the seeds that found it. */
export function dedupeFindings(runs) {
	let byKey = new Map()
	for (let {seed, lines} of runs) {
		for (let finding of stoppingFindings(lines)) {
			let frame = topFrame(finding.stack)
			let key = `${finding.kind}\n${finding.message}\n${frame}`
			let entry = byKey.get(key) ?? {kind: finding.kind, message: finding.message, frame, seeds: []}
			if (!entry.seeds.includes(seed)) entry.seeds.push(seed)
			byKey.set(key, entry)
		}
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

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	let root = process.argv[2] ?? 'logs/chaos'
	let runs = readdirSync(root)
		.filter((seed) => existsSync(join(root, seed, 'chaos-findings.jsonl')))
		.map((seed) => ({
			seed: Number(seed),
			lines: readFileSync(join(root, seed, 'chaos-findings.jsonl'), 'utf8').split('\n'),
		}))
	process.stdout.write(renderSummary(dedupeFindings(runs)))
}
