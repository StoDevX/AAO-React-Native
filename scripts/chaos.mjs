#!/usr/bin/env node

// Runs the chaos monkey against a booted simulator and collects what it found
// into logs/chaos/<seed>/, or logs/chaos/<seed>-replay/ for a replay. See
// the Chaos Runs section of AGENTS.md.

import {copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'

import {
	chaosOutputDir,
	parseChaosArgs,
	replayVerdict,
	runOutcome,
	stoppingFindings,
	testEnv,
	withReplayBudget,
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

// Anything thrown before the run could judge itself -- a bad flag, no booted
// simulator, a replay with no tape -- means the run did not start.
try {
	main()
} catch (error) {
	console.error(error.message)
	process.exitCode = 2
}

function main() {
	let options = parseChaosArgs(process.argv.slice(2))
	let out = chaosOutputDir(options)

	// A replay only reads the run it replays, so read all of it up front.
	let recorded = options.replay
		? {
				steps: stepLines(join(options.replay, 'attachments')),
				stop: stopReason(join(options.replay, 'attachments')),
				tape: readFileSync(join(options.replay, 'chaos-tape.jsonl')),
			}
		: null
	if (recorded) {
		options = withReplayBudget(options, recorded.steps)
	}

	let device = bootedSimulator()
	console.log(`chaos seed ${options.seed} on ${device.name} (${device.udid}) -> ${out}`)

	if (!process.env.TEST_RUNNER_AAO_JS_LOCATION && !process.env.TEST_RUNNER_AAO_JS_EMBEDDED) {
		console.warn(
			'neither TEST_RUNNER_AAO_JS_LOCATION nor TEST_RUNNER_AAO_JS_EMBEDDED is set; the test will refuse to run',
		)
	}

	if (!options.prebuilt) {
		buildForTesting(device.udid)
	}

	// A replay reads the recorded tape from the app's Documents; a recording starts clean.
	for (let name of FILES) {
		let inApp = appDataPath(device.udid, `Documents/${name}`)
		if (!inApp) continue
		rmSync(inApp, {force: true})
		if (recorded && name === 'chaos-tape.jsonl') {
			writeFileSync(inApp, recorded.tape)
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
		if (inApp && existsSync(inApp) && !(recorded && name === 'chaos-tape.jsonl')) {
			copyFileSync(inApp, join(out, name))
		}
	}
	if (recorded) {
		writeFileSync(join(out, 'chaos-tape.jsonl'), recorded.tape)
	}
	// A run that failed early may leave no result bundle; what it did leave
	// still decides the outcome below.
	try {
		run(
			'xcrun',
			[
				'xcresulttool',
				'export',
				'attachments',
				'--path',
				resultBundle,
				'--output-path',
				join(out, 'attachments'),
			],
			{stdio: 'pipe'},
		)
	} catch (error) {
		console.warn(`could not export the run's attachments: ${error.stderr || error.message}`)
	}

	let steps = stepLines(join(out, 'attachments')) ?? []
	let stop = stopReason(join(out, 'attachments'))
	let verdict = recorded
		? replayVerdict({
				recordedSteps: recorded.steps ?? [],
				recordedStop: recorded.stop,
				replaySteps: steps,
				replayStop: stop,
			})
		: null
	if (verdict) {
		console.log(`replay ${verdict.message}`)
	}

	// A stopping finding (fatal, an unhandled rejection, or a replay divergence)
	// can land here without failing the test itself: a fatal error raised under
	// a modal can slip past the beacon, so the findings file is the one place
	// that is checked no matter how the test exited.
	let findingsPath = join(out, 'chaos-findings.jsonl')
	let findingLines = existsSync(findingsPath) ? readFileSync(findingsPath, 'utf8').split('\n') : []
	let outcome = runOutcome({
		testFailed: testError !== null,
		stepCount: steps.length,
		stopReason: stop,
		stoppingFindings: stoppingFindings(findingLines),
	})
	if (outcome.exitCode === 2 && testError) {
		console.error(testError.message)
	}
	writeFileSync(
		join(out, 'outcome.json'),
		`${JSON.stringify({...outcome, stopReason: stop, replay: verdict?.message ?? null}, null, '\t')}\n`,
	)
	console.log(
		outcome.exitCode === 0
			? `${outcome.message}: seed ${options.seed}`
			: `${outcome.message}: see ${out}`,
	)
	process.exitCode = outcome.exitCode
}

/** The text of the first exported attachment whose name starts with `prefix`, or null. */
function attachmentText(dir, prefix) {
	let manifestPath = join(dir, 'manifest.json')
	if (!existsSync(manifestPath)) return null
	let manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
	let file = manifest
		.flatMap((test) => test.attachments)
		.find((attachment) => attachment.suggestedHumanReadableName.startsWith(prefix))
	return file ? readFileSync(join(dir, file.exportedFileName), 'utf8') : null
}

/** The steps the monkey took, from a run's exported attachments; null if it logged none. */
function stepLines(dir) {
	let text = attachmentText(dir, 'chaos-steps')
	return text === null ? null : text.split('\n').filter((line) => line.trim())
}

/** Why the monkey stopped the run, or null if it used up its budget. */
function stopReason(dir) {
	return attachmentText(dir, 'chaos-stop')?.trim() || null
}
