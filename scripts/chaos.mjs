#!/usr/bin/env node

// Runs the chaos monkey against a booted simulator and collects what it found
// into logs/chaos/<seed>/. See the Chaos section of AGENTS.md.

import {copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'

import {firstDivergence, parseChaosArgs, testEnv} from './chaos-run.mjs'
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
let failed = false
try {
	testWithoutBuilding({
		udid: device.udid,
		xctestrun: findXctestrun(),
		only: ['AllAboutOlafUITests/ChaosTests/testChaos'],
		env: testEnv(options),
		resultBundle,
	})
} catch {
	failed = true
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

if (previousSteps) {
	let step = firstDivergence(previousSteps, stepLines(join(out, 'attachments')))
	console.log(
		step === null ? 'replay followed the recorded steps' : `replay diverged at step ${step}`,
	)
}
console.log(
	failed ? `chaos found something: see ${out}` : `chaos seed ${options.seed} found nothing`,
)
process.exitCode = failed ? 1 : 0

/** The step log among a run's exported attachments. */
function stepLines(dir) {
	let manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'))
	let file = manifest
		.flatMap((test) => test.attachments)
		.find((attachment) => attachment.suggestedHumanReadableName.startsWith('chaos-steps'))
	return file ? readFileSync(join(dir, file.exportedFileName), 'utf8').trim().split('\n') : []
}
