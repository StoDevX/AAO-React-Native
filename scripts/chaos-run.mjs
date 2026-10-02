// The decisions behind mise run chaos, kept apart from the commands it runs.

import {basename} from 'node:path'
import {randomInt} from 'node:crypto'

/** Seconds in `text`: a bare number, or one ending s, m or h. */
export function parseDuration(text) {
	let match = /^(\d+)([smh]?)$/u.exec(text)
	if (!match) throw new Error(`not a duration: ${text} (try 90s, 10m, 1h)`)
	let [, amount, unit] = match
	return Number(amount) * {'': 1, s: 1, m: 60, h: 3600}[unit]
}

/** mise run chaos's options from its arguments. */
export function parseChaosArgs(argv) {
	let options = {
		seed: null,
		steps: 100_000,
		duration: 600,
		faultRate: '0.25',
		replay: null,
		prebuilt: false,
	}
	for (let i = 0; i < argv.length; i++) {
		let flag = argv[i]
		let value = () => {
			if (i + 1 >= argv.length) throw new Error(`${flag} needs a value`)
			return argv[++i]
		}
		switch (flag) {
			case '--seed':
				options.seed = Number(value())
				break
			case '--steps':
				options.steps = Number(value())
				break
			case '--duration':
				options.duration = parseDuration(value())
				break
			case '--fault-rate':
				options.faultRate = value()
				break
			case '--replay':
				options.replay = value()
				break
			case '--prebuilt':
				options.prebuilt = true
				break
			default:
				throw new Error(`unknown flag ${flag}`)
		}
	}
	if (options.seed === null) {
		options.seed = options.replay ? Number(basename(options.replay)) : randomInt(1, 2 ** 31)
	}
	if (!Number.isInteger(options.seed) || options.seed <= 0) {
		throw new Error('the seed must be a positive whole number')
	}
	return options
}

/** The run's settings, as the variables xcodebuild hands the test runner. */
export function testEnv(options) {
	let env = {
		TEST_RUNNER_AAO_CHAOS_SEED: String(options.seed),
		TEST_RUNNER_AAO_CHAOS_STEPS: String(options.steps),
		TEST_RUNNER_AAO_CHAOS_DURATION: String(options.duration),
		TEST_RUNNER_AAO_CHAOS_FAULT_RATE: options.faultRate,
	}
	if (options.replay) env.TEST_RUNNER_AAO_CHAOS_REPLAY = '1'
	return env
}

/** The first step at which two step logs disagree, or null if one is a prefix of the other. */
export function firstDivergence(before, after) {
	let length = Math.min(before.length, after.length)
	for (let i = 0; i < length; i++) {
		if (before[i] !== after[i]) return i
	}
	return null
}

/**
 * The kinds of finding severe enough to fail a run on their own, mirroring
 * source/chaos/findings.ts's STOPPING -- duplicated here since that module is
 * TypeScript and this script is not.
 */
const STOPPING_FINDING_KINDS = new Set(['fatal', 'unhandled-rejection', 'divergence'])

/** Every parseable finding in `lines`; a line torn by a crash is skipped. */
export function parseFindingLines(lines) {
	let findings = []
	for (let line of lines) {
		if (!line.trim()) continue
		try {
			findings.push(JSON.parse(line))
		} catch {
			// A process killed mid-write leaves a partial last line.
		}
	}
	return findings
}

/** The findings among `lines` severe enough to fail a run even if the test itself passed. */
export function stoppingFindings(lines) {
	return parseFindingLines(lines).filter((finding) => STOPPING_FINDING_KINDS.has(finding.kind))
}

/**
 * What a chaos run found, settled after the fact: a bare XCTest failure
 * alone can't tell a finding from the run never having started, and a
 * stopping finding can land in chaos-findings.jsonl without failing the
 * test, when a fatal error under a modal slips past the beacon.
 */
export function runOutcome({testFailed, stepsLogged, stoppingFindings: findings}) {
	if (findings.length > 0) {
		let list = findings.map((finding) => `${finding.kind}: ${finding.message}`).join('\n')
		return {exitCode: 1, message: `chaos found something:\n${list}`}
	}
	if (testFailed) {
		return stepsLogged
			? {exitCode: 1, message: 'chaos found something'}
			: {exitCode: 2, message: 'the chaos run did not start'}
	}
	return {exitCode: 0, message: 'chaos found nothing'}
}
