// The decisions behind mise run chaos, kept apart from the commands it runs.

import {basename, join, resolve} from 'node:path'
import {randomInt} from 'node:crypto'

/** Seconds in `text`: a bare number, or one ending s, m or h. */
export function parseDuration(text) {
	let match = /^(\d+)([smh]?)$/u.exec(text)
	if (!match) throw new Error(`not a duration: ${text} (try 90s, 10m, 1h)`)
	let [, amount, unit] = match
	return Number(amount) * {'': 1, s: 1, m: 60, h: 3600}[unit]
}

/** How long a replay may run unless told otherwise: its step count is its bound. */
export const REPLAY_DURATION = 24 * 3600

/**
 * mise run chaos's options from its arguments. A replay's step budget stays
 * null unless given, for `withReplayBudget` to fill from the recording.
 */
export function parseChaosArgs(argv) {
	let options = {
		seed: null,
		steps: null,
		duration: null,
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
	if (options.replay) {
		if (options.seed !== null) {
			throw new Error(
				'--seed and --replay cannot be combined: a replay takes its seed from its directory',
			)
		}
		let digits = /^\d+/u.exec(basename(options.replay))
		if (!digits) {
			throw new Error(`no seed at the start of ${options.replay}'s name`)
		}
		options.seed = Number(digits[0])
		options.duration ??= REPLAY_DURATION
	} else {
		options.seed ??= randomInt(1, 2 ** 31)
		options.steps ??= 100_000
		options.duration ??= 600
	}
	if (!Number.isInteger(options.seed) || options.seed <= 0) {
		throw new Error('the seed must be a positive whole number')
	}
	return options
}

/** A replay's options with its step budget, by default the recording's step count. */
export function withReplayBudget(options, recordedSteps) {
	return {...options, steps: options.steps ?? recordedSteps?.length ?? 0}
}

/**
 * Where a run writes what it found: a replay beside the run it replays,
 * which it only reads, so the evidence it was asked to reproduce survives.
 */
export function chaosOutputDir(options) {
	let seed = String(options.seed)
	let out = join('logs', 'chaos', options.replay ? `${seed}-replay` : seed)
	if (options.replay && resolve(options.replay) === resolve(out)) {
		throw new Error(`replay the original run, ${join('logs', 'chaos', seed)}, not its replay`)
	}
	return out
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
 * Whether a replay reproduced how the recording stopped. Its steps are
 * compared first: a replay that took another step went somewhere else, and
 * what it found there says nothing about the recording.
 */
export function replayVerdict({recordedSteps, recordedStop, replaySteps, replayStop}) {
	let step = firstDivergence(recordedSteps, replaySteps)
	if (step !== null) {
		return {reproduced: false, message: `diverged at step ${step}`}
	}
	if (!recordedStop) {
		return {reproduced: null, message: 'followed the recorded steps'}
	}
	if (replayStop === recordedStop) {
		return {reproduced: true, message: `reproduced: ${replayStop}`}
	}
	if (!replayStop && replaySteps.length < recordedSteps.length) {
		return {
			reproduced: null,
			message: `not reached: the replay ended after ${replaySteps.length} of ${recordedSteps.length} recorded steps`,
		}
	}
	let how = replayStop
		? `stopped at step ${replaySteps.length} with ${replayStop}`
		: `took all ${recordedSteps.length} recorded steps without stopping`
	return {reproduced: false, message: `not reproduced: ${how} (recorded ${recordedStop})`}
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

/** How the monkey reports a launch whose bundle never answered. */
const PROBE_SILENT = 'probe silent'

/**
 * What a chaos run found, settled after the fact: a bare XCTest result alone
 * can't tell a finding from the run never having started, and a stopping
 * finding can land in chaos-findings.jsonl without failing the test, when a
 * fatal error under a modal slips past the beacon. A run that took no step
 * did not start, whether its test passed or failed, unless the monkey
 * stopped it on something the app showed.
 */
export function runOutcome({testFailed, stepCount, stopReason, stoppingFindings: findings}) {
	if (findings.length > 0) {
		let list = findings.map((finding) => `${finding.kind}: ${finding.message}`).join('\n')
		return {exitCode: 1, message: `chaos found something:\n${list}`}
	}
	let neverAnswered = stepCount === 0 && stopReason?.startsWith(PROBE_SILENT)
	if (stopReason && !neverAnswered) {
		return {exitCode: 1, message: `chaos found something:\n${stopReason}`}
	}
	if (stepCount === 0) {
		return {
			exitCode: 2,
			message: stopReason
				? `the chaos run did not start: ${stopReason}`
				: 'the chaos run did not start',
		}
	}
	if (testFailed) {
		return {exitCode: 1, message: 'chaos found something'}
	}
	return {exitCode: 0, message: 'chaos found nothing'}
}
