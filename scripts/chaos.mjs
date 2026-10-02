#!/usr/bin/env node

// Runs the chaos monkey against a booted simulator and collects what it found
// into logs/chaos/<seed>/. See the Chaos section of AGENTS.md.

import {copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'

import {
	firstDivergence,
	parseChaosArgs,
	runOutcome,
	stoppingFindings,
	testEnv,
} from './chaos-run.mjs'
import {
	appDataPath,
	bootedSimulator,
	buildForTesting,
	findXctestrun,
	run,
	testWithoutBuilding,
} from './uitest-run.mjs'

const FILES = ['chaos-tape.jsonl', 'chaos-findings.jsonl']

let options = parseChaosArgs(process.argv.slice(2))
let device = bootedSimulator()
let out = join('logs', 'chaos', String(options.seed))
console.log(`chaos seed ${options.seed} on ${device.name} (${device.udid}) -> ${out}`)

if (!process.env.TEST_RUNNER_AAO_JS_LOCATION && !process.env.TEST_RUNNER_AAO_JS_EMBEDDED) {
	console.warn(
		'neither TEST_RUNNER_AAO_JS_LOCATION nor TEST_RUNNER_AAO_JS_EMBEDDED is set; the test will refuse to run',
	)
}

if (!options.prebuilt) {
	buildForTesting(device.udid)
}

// The previous step log, for a replay to compare against. A replay's seed is
// its own log directory's name, so `out` below is `options.replay` itself:
// read the tape into memory before clearing `out`, since the file on disk
// would otherwise be gone before the copy below can read it back out.
let previousSteps = options.replay ? stepLines(join(options.replay, 'attachments')) : null
let recordedTape = options.replay ? readFileSync(join(options.replay, 'chaos-tape.jsonl')) : null

// A replay reads the recorded tape from the app's Documents; a recording starts clean.
for (let name of FILES) {
	let inApp = appDataPath(device.udid, `Documents/${name}`)
	if (!inApp) continue
	rmSync(inApp, {force: true})
	if (options.replay && name === 'chaos-tape.jsonl') {
		writeFileSync(inApp, recordedTape)
	}
}

rmSync(out, {recursive: true, force: true})
mkdirSync(out, {recursive: true})
let resultBundle = join(out, 'result.xcresult')
let testError = null
try {
	testWithoutBuilding({
		udid: device.udid,
		xctestrun: findXctestrun(),
		only: ['AllAboutOlafUITests/ChaosTests/testChaos'],
		env: testEnv(options),
		resultBundle,
	})
} catch (error) {
	testError = error
}

for (let name of FILES) {
	let inApp = appDataPath(device.udid, `Documents/${name}`)
	if (inApp && existsSync(inApp) && !(options.replay && name === 'chaos-tape.jsonl')) {
		copyFileSync(inApp, join(out, name))
	}
}
if (options.replay) {
	writeFileSync(join(out, 'chaos-tape.jsonl'), recordedTape)
}
run('xcrun', [
	'xcresulttool',
	'export',
	'attachments',
	'--path',
	resultBundle,
	'--output-path',
	join(out, 'attachments'),
])

let newSteps = stepLines(join(out, 'attachments'))
if (previousSteps) {
	if (newSteps) {
		let step = firstDivergence(previousSteps, newSteps)
		console.log(
			step === null ? 'replay followed the recorded steps' : `replay diverged at step ${step}`,
		)
	} else {
		console.log('replay recorded no steps to compare')
	}
}

// A stopping finding (fatal, an unhandled rejection, or a replay divergence)
// can land here without failing the test itself: a fatal error raised under
// a modal can slip past the beacon, so the findings file is the one place
// that is checked no matter how the test exited.
let findingsPath = join(out, 'chaos-findings.jsonl')
let findingLines = existsSync(findingsPath) ? readFileSync(findingsPath, 'utf8').split('\n') : []
let outcome = runOutcome({
	testFailed: testError !== null,
	stepsLogged: newSteps !== null,
	stoppingFindings: stoppingFindings(findingLines),
})
if (outcome.exitCode === 2) {
	console.error(testError.message)
}
console.log(
	outcome.exitCode === 0
		? `${outcome.message}: seed ${options.seed}`
		: `${outcome.message}: see ${out}`,
)
process.exitCode = outcome.exitCode

/** The step log among a run's exported attachments, or null if it has none. */
function stepLines(dir) {
	let manifestPath = join(dir, 'manifest.json')
	if (!existsSync(manifestPath)) return null
	let manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
	let file = manifest
		.flatMap((test) => test.attachments)
		.find((attachment) => attachment.suggestedHumanReadableName.startsWith('chaos-steps'))
	return file ? readFileSync(join(dir, file.exportedFileName), 'utf8').trim().split('\n') : null
}
