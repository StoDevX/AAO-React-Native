// The decisions behind mise run chaos, kept apart from the commands it runs.

import {basename, join} from 'node:path'
import {randomInt} from 'node:crypto'

/** Seconds in `text`: a bare number, or one ending s, m or h. */
export function parseDuration(text) {
	let match = /^(\d+)([smh]?)$/u.exec(text)
	if (!match) throw new Error(`not a duration: ${text} (try 90s, 10m, 1h)`)
	let [, amount, unit] = match
	return Number(amount) * {'': 1, s: 1, m: 60, h: 3600}[unit]
}

/** A step budget: a positive whole number. */
function parseSteps(text) {
	if (!/^\d+$/u.test(text) || Number(text) === 0) {
		throw new Error(`--steps must be a positive whole number, not ${JSON.stringify(text)}`)
	}
	return Number(text)
}

/**
 * The share of requests to break, from 0 to 1, written out the way the app's
 * Swift parser reads it, so `.5` arrives as `0.5`.
 */
function parseFaultRate(text) {
	let rate = /^(?:\d+(?:\.\d*)?|\.\d+)$/u.test(text) ? Number(text) : Number.NaN
	if (!(rate >= 0 && rate <= 1)) {
		throw new Error(`--fault-rate must be a number from 0 to 1, not ${JSON.stringify(text)}`)
	}
	return String(rate)
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
		overwrite: false,
		rotate: false,
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
				options.steps = parseSteps(value())
				break
			case '--duration':
				options.duration = parseDuration(value())
				break
			case '--fault-rate':
				options.faultRate = parseFaultRate(value())
				break
			case '--replay':
				options.replay = value()
				break
			case '--prebuilt':
				options.prebuilt = true
				break
			case '--overwrite':
				options.overwrite = true
				break
			case '--rotate':
				options.rotate = true
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
 * A replay's options with rotation as the recording had it, read from its
 * rotate steps: one that did nothing is logged `off`. A recording with no
 * rotate step replays the same either way, so the flag given stands.
 */
export function withRecordedRotation(options, recordedSteps) {
	let rotations = (recordedSteps ?? [])
		.map((line) => JSON.parse(line))
		.filter((step) => step.action === 'rotate')
	if (rotations.length === 0) return options
	return {...options, rotate: rotations[0].label !== 'off'}
}

/**
 * Where a run writes what it found: a replay beside the run it replays,
 * which it only reads, so the evidence it was asked to reproduce survives.
 * Replaying a `-replay` directory would read and then delete it, so that's
 * refused by name -- checked case-insensitively, since macOS's default APFS
 * volume is case-insensitive and would otherwise let `--replay 1234-REPLAY`
 * through to `rmSync`.
 */
export function chaosOutputDir(options) {
	let seed = String(options.seed)
	let out = join('logs', 'chaos', options.replay ? `${seed}-replay` : seed)
	if (options.replay && basename(options.replay).toLowerCase().endsWith('-replay')) {
		throw new Error(`replay the original run, ${join('logs', 'chaos', seed)}, not its replay`)
	}
	return out
}

/**
 * Refuses to record into `out` when an earlier run of the seed left evidence
 * there, since a run starts by clearing its directory. `--overwrite` allows
 * it. A replay's directory is always safe to clear: the run it replays is
 * kept elsewhere and can be replayed again.
 */
export function checkOutputDir({options, out, exists}) {
	if (exists && !options.replay && !options.overwrite) {
		throw new Error(
			`${out} already holds a run of seed ${options.seed}; pass --overwrite to replace it, or replay it with --replay ${out}`,
		)
	}
}

/** Where the app writes what its probe saw; source/chaos/findings.ts's FINDINGS_FILE. */
export const FINDINGS_FILE = 'chaos-findings.jsonl'

/**
 * One launch's tape, as source/chaos/tape.ts's `tapeFile` names it. Each
 * launch writes its own, so a replay launch parses only its own answers.
 */
export const TAPE_FILE_PATTERN = /^chaos-tape-(\d+)\.jsonl$/u

/** The single tape every launch shared before each launch had its own. */
const SHARED_TAPE_FILE = 'chaos-tape.jsonl'

/** The launch a tape's file name is for. */
function tapeLaunch(name) {
	return Number(TAPE_FILE_PATTERN.exec(name)[1])
}

/** The tapes among `names`, in launch order. */
export function tapeFiles(names) {
	return names
		.filter((name) => TAPE_FILE_PATTERN.test(name))
		.sort((a, b) => tapeLaunch(a) - tapeLaunch(b))
}

/** The tapes a replay of the recording in `dir`, holding `names`, stages for the app. */
export function recordedTapes(dir, names) {
	let tapes = tapeFiles(names)
	if (tapes.length > 0) {
		return tapes
	}
	if (names.includes(SHARED_TAPE_FILE)) {
		throw new Error(
			`${dir} was recorded before per-launch tapes, and can't be replayed; record the seed again`,
		)
	}
	throw new Error(`${dir} has no tape to replay`)
}

/** Whether `name` is a file a run leaves in the app's Documents, which the next run clears. */
export function isRunFile(name) {
	return name === FINDINGS_FILE || name === SHARED_TAPE_FILE || TAPE_FILE_PATTERN.test(name)
}

/**
 * Refuses a replay when the app, though just installed, has no data container
 * on the simulator: its tapes would have nowhere to go, and a replay with no
 * tapes answers every request as a divergence. A recording has nothing to
 * stage, so it goes ahead.
 */
export function checkAppContainer({documents, replaying, udid}) {
	if (!documents && replaying) {
		throw new Error(
			`the app has no data container on ${udid} after installing it, so the replay's tapes cannot be staged`,
		)
	}
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
	if (options.rotate) env.TEST_RUNNER_AAO_CHAOS_ROTATE = '1'
	return env
}

/** XCTest's suffix on an exported attachment's suggested name: `_<index>_<UUID>` before the extension. */
const ATTACHMENT_SUFFIX =
	/_\d+_[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}(?=\.[^.]+$|$)/iu

/**
 * Each exported attachment's file name, mapped to the name it was attached
 * under. A second attachment of one name is numbered, so neither is lost.
 */
export function readableAttachmentNames(manifest) {
	let names = new Map()
	let taken = new Set()
	for (let attachment of manifest.flatMap((test) => test.attachments)) {
		let name = attachment.suggestedHumanReadableName.replace(ATTACHMENT_SUFFIX, '')
		let dot = name.lastIndexOf('.')
		let [stem, extension] = dot > 0 ? [name.slice(0, dot), name.slice(dot)] : [name, '']
		let candidate = name
		for (let n = 2; taken.has(candidate); n++) {
			candidate = `${stem} ${n}${extension}`
		}
		taken.add(candidate)
		names.set(attachment.exportedFileName, candidate)
	}
	return names
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
 * TypeScript and this script is not. chaos-parity.test.mjs keeps them equal.
 */
export const STOPPING_FINDING_KINDS = new Set(['fatal', 'unhandled-rejection', 'divergence'])

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
 * The run's ignore list from scripts/chaos-ignore.json's text. Each entry
 * hides warnings or findings of `kind` whose text contains `match`, and must
 * say `why`, so nothing is hidden without a reason someone can check.
 */
export function parseIgnoreList(text) {
	let entries = JSON.parse(text)
	if (!Array.isArray(entries)) {
		throw new TypeError('scripts/chaos-ignore.json must hold a list')
	}
	for (let entry of entries) {
		for (let field of ['kind', 'match', 'why']) {
			if (typeof entry?.[field] !== 'string' || entry[field] === '') {
				throw new Error(
					`scripts/chaos-ignore.json: every entry needs a ${field}; ${JSON.stringify(entry)} has none`,
				)
			}
		}
	}
	return entries
}

/** Findings that are counted, not listed: there are many, and none is a bug alone. */
const COUNTED_KINDS = ['mutation', 'out-of-app']

/** The first line of `text`. */
function firstLine(text) {
	return String(text).split('\n')[0].trim()
}

/**
 * A monkey warning's kind and detail: `kind: detail`, with the detail possibly
 * empty, or a bare line named by what comes before ` (`.
 */
function splitWarning(line) {
	let colon = /:(?: |$)/u.exec(line)
	if (colon && colon.index > 0) {
		return {kind: line.slice(0, colon.index), detail: line.slice(colon.index + colon[0].length)}
	}
	let paren = line.indexOf(' (')
	return {kind: paren > 0 ? line.slice(0, paren) : line, detail: line}
}

/** Adds one member to the group under `key`, keeping groups in first-seen order. */
function addTo(groups, key, kind, example) {
	let group = groups.get(key)
	if (group) {
		group.count++
	} else {
		groups.set(key, {kind, count: 1, example})
	}
}

/**
 * Everything a run saw that did not stop it, counted: the monkey's warnings by
 * kind, console errors and stalls by kind and first line with digits
 * collapsed, and mutations and attempts to leave the app as bare counts.
 * Anything the ignore list matches is counted as ignored instead.
 */
export function summarizeRun({findings, warnings, ignore}) {
	let ignored = 0
	let isIgnored = (kind, text) =>
		ignore.some((entry) => entry.kind === kind && text.includes(entry.match))

	let warningGroups = new Map()
	for (let line of warnings) {
		if (!line.trim()) continue
		let {kind, detail} = splitWarning(line.trim())
		if (isIgnored(kind, line)) {
			ignored++
			continue
		}
		addTo(warningGroups, kind, kind, firstLine(detail))
	}

	let findingGroups = new Map()
	let counts = {mutation: 0, 'out-of-app': 0}
	for (let finding of findings) {
		if (STOPPING_FINDING_KINDS.has(finding.kind)) continue
		let message = String(finding.message)
		if (isIgnored(finding.kind, message)) {
			ignored++
			continue
		}
		if (COUNTED_KINDS.includes(finding.kind)) {
			counts[finding.kind]++
			continue
		}
		let line = firstLine(message)
		addTo(findingGroups, `${finding.kind} ${line.replaceAll(/\d+/gu, '#')}`, finding.kind, line)
	}

	return {
		warnings: [...warningGroups.values()],
		findings: [...findingGroups.values()],
		counts,
		ignored,
	}
}

/** How many characters of a group's example the summary prints. */
const EXAMPLE_LENGTH = 100

/** `text`, cut to `EXAMPLE_LENGTH` with an ellipsis when it is longer. */
function clip(text) {
	return text.length > EXAMPLE_LENGTH ? `${text.slice(0, EXAMPLE_LENGTH - 1)}…` : text
}

/** `summary` as the lines printed under a run's outcome; `outcome.json` keeps the examples whole. */
export function formatSummary(summary) {
	let lines = []
	if (summary.warnings.length > 0) {
		lines.push('  warnings')
		for (let group of summary.warnings) {
			lines.push(`    ${group.kind} ×${group.count}  ${clip(group.example)}`)
		}
	}
	for (let group of summary.findings) {
		lines.push(`  ${group.kind} ×${group.count}  ${clip(group.example)}`)
	}
	lines.push(
		`  mutations ×${summary.counts.mutation}   out-of-app ×${summary.counts['out-of-app']}   ignored ×${summary.ignored}`,
	)
	return lines.join('\n')
}

/**
 * The launch a run stopped in: its last step's, or the first launch when it
 * took no step, as when the app dies on what it was fed at launch.
 */
export function stopLaunch(steps) {
	return steps.length > 0 ? JSON.parse(steps.at(-1)).launch : 0
}

/** The mutations one launch's tape records, as `key path: change`; a torn line is skipped. */
export function stopMutations(tapeLines) {
	return parseFindingLines(tapeLines)
		.filter((entry) => entry.mutation)
		.map((entry) => `${entry.key} ${entry.mutation.path}: ${entry.mutation.change}`)
}

/** How the monkey reports a launch whose bundle never answered. */
const PROBE_SILENT = 'probe silent'

/**
 * What a chaos run found, settled after the fact: a bare XCTest result alone
 * can't tell a finding from the run never having started, and a stopping
 * finding can land in chaos-findings.jsonl without failing the test, when a
 * fatal error under a modal slips past the beacon. A run that took no step
 * did not start, whether its test passed or failed, unless the monkey
 * stopped it on something the app showed. `attachmentsError` is different
 * from taking no step: the run may have taken plenty, but xcresulttool
 * couldn't export them, so there is nothing to call "did not start".
 */
export function runOutcome({
	testFailed,
	stepCount,
	stopReason,
	stoppingFindings: findings,
	attachmentsError,
}) {
	if (findings.length > 0) {
		let list = findings.map((finding) => `${finding.kind}: ${finding.message}`).join('\n')
		return {exitCode: 1, message: `chaos found something:\n${list}`}
	}
	let neverAnswered = stepCount === 0 && stopReason?.startsWith(PROBE_SILENT)
	if (stopReason && !neverAnswered) {
		return {exitCode: 1, message: `chaos found something:\n${stopReason}`}
	}
	if (attachmentsError) {
		if (testFailed) {
			return {exitCode: 1, message: 'chaos found something'}
		}
		return {
			exitCode: 2,
			message: `the run's attachments could not be read: ${attachmentsError}`,
		}
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

/**
 * Why a run has no JavaScript to test, or null when it has some.
 *
 * The test refuses to start without a Metro named through
 * TEST_RUNNER_AAO_JS_LOCATION or a bundle embedded in the built .app, so this
 * says so before a build rather than after one. xcodebuild hands the test
 * runner only TEST_RUNNER_-prefixed variables, so a bare AAO_JS_LOCATION in
 * the shell never arrives.
 */
export function jsSourceProblem({env, hasEmbeddedBundle}) {
	if (env.TEST_RUNNER_AAO_JS_LOCATION || hasEmbeddedBundle) {
		return null
	}
	let lines = [
		'No JavaScript source for the run: name the Metro serving this checkout, e.g.',
		'  TEST_RUNNER_AAO_JS_LOCATION=localhost:8091 mise run chaos',
		'or, for the Metro on 8081, mise run chaos:8081',
	]
	if (env.AAO_JS_LOCATION) {
		lines.push(
			'AAO_JS_LOCATION is set without the TEST_RUNNER_ prefix; xcodebuild passes only',
			'TEST_RUNNER_-prefixed variables to the test, so it never arrives.',
		)
	}
	return lines.join('\n')
}

/**
 * Why the Metro at `location` cannot serve the run, or null when it serves
 * this checkout.
 *
 * `projectRoot` is what Metro's /status reports in its
 * X-React-Native-Project-Root header, or null when nothing answered. Port 8081
 * belongs to whichever checkout started Metro first, so a run against another
 * checkout's Metro would test that checkout's JavaScript and blame this one.
 */
export function metroProblem({location, projectRoot, checkout}) {
	if (projectRoot === null) {
		return `No Metro answered at ${location}; start Metro for this checkout, or name the one serving it.`
	}
	if (projectRoot !== checkout) {
		return `The Metro at ${location} serves ${projectRoot}, not ${checkout}; name the Metro serving this checkout.`
	}
	return null
}

/** The failure messages in `xcresulttool get test-results tests` output, in order. */
export function testFailureMessages(results) {
	let messages = []
	let visit = (node) => {
		if (node.nodeType === 'Failure Message') {
			messages.push(node.name)
		}
		for (let child of node.children ?? []) {
			visit(child)
		}
	}
	for (let node of results.testNodes ?? []) {
		visit(node)
	}
	return messages
}
