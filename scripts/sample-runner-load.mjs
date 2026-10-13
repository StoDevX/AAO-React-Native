#!/usr/bin/env node
/**
 * Sample the runner's CPU and memory load until killed, one JSON line per
 * reading, for the UI-test report's telemetry in flakiness.io.
 *
 * The first line holds the core count and total memory; each later line the
 * time, the average and busiest core's load, and the share of memory in use,
 * all in percent. A line cut short by the job ending is skipped on reading.
 *
 * The UI-test job installs no packages, so this imports nothing but Node.
 */

import {execFileSync} from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import {setTimeout as sleep} from 'node:timers/promises'

const INTERVAL_MS = 2000

/** Each core's busy and total time so far. */
function readCpus() {
	return os.cpus().map(({times}) => {
		const total = times.user + times.nice + times.sys + times.irq + times.idle
		return {busy: total - times.idle, total}
	})
}

/**
 * The cores' load between two readings, in percent: the average across them
 * and the busiest one. Gives nothing if the core count changed.
 */
export function cpuLoad(before, after) {
	if (before.length !== after.length || after.length === 0) {
		return
	}

	const loads = after.map((core, index) => {
		const total = core.total - before[index].total
		return total === 0 ? 0 : ((core.busy - before[index].busy) / total) * 100
	})
	return {avg: loads.reduce((sum, load) => sum + load, 0) / loads.length, max: Math.max(...loads)}
}

/**
 * Memory macOS could hand out now: free pages, plus inactive and speculative
 * ones it can reclaim. `os.freemem()` counts only the free ones, which on
 * macOS reads as nearly full all the time.
 */
export function freeBytesFromVmStat(text) {
	const pageSize = Number(text.match(/page size of (\d+) bytes/u)?.[1])
	if (!Number.isFinite(pageSize)) {
		return
	}

	let pages = 0
	for (const match of text.matchAll(/^Pages (?:free|inactive|speculative):\s+(\d+)/gmu)) {
		pages += Number(match[1])
	}
	return pages * pageSize
}

function freeBytes() {
	if (os.platform() !== 'darwin') {
		return os.freemem()
	}
	try {
		return freeBytesFromVmStat(execFileSync('vm_stat', {encoding: 'utf8'})) ?? os.freemem()
	} catch {
		return os.freemem()
	}
}

async function main() {
	const outputPath = process.argv[2]
	if (!outputPath) {
		console.error('usage: sample-runner-load.mjs <output.jsonl>')
		process.exit(2)
	}

	const totalBytes = os.totalmem()
	fs.writeFileSync(
		outputPath,
		`${JSON.stringify({cpuCount: os.cpus().length, ramBytes: totalBytes})}\n`,
	)

	let before = readCpus()
	for (;;) {
		// Each reading waits on the last: the gap between them is the sample.
		// oxlint-disable-next-line no-await-in-loop
		await sleep(INTERVAL_MS)
		const after = readCpus()
		const load = cpuLoad(before, after)
		before = after
		if (!load) {
			continue
		}

		const ram = ((totalBytes - freeBytes()) / totalBytes) * 100
		fs.appendFileSync(
			outputPath,
			`${JSON.stringify({t: Date.now(), cpuAvg: load.avg, cpuMax: load.max, ram})}\n`,
		)
	}
}

if (import.meta.main) {
	main()
}
