#!/usr/bin/env node

// Runs the chaos monkey against a booted simulator and collects what it found
// into logs/chaos/<seed>/, or logs/chaos/<seed>-replay/ for a replay. See
// uitests/Chaos/README.md.

import {
	copyFileSync,
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	realpathSync,
	renameSync,
	rmSync,
	writeFileSync,
} from 'node:fs'
import {join} from 'node:path'

import {
	chaosOutputDir,
	checkAppContainer,
	checkOutputDir,
	FINDINGS_FILE,
	isRunFile,
	recordedTapes,
	tapeFiles,
	parseChaosArgs,
	readableAttachmentNames,
	replayVerdict,
	jsSourceProblem,
	metroProblem,
	runOutcome,
	testFailureMessages,
	stoppingFindings,
	testEnv,
	withRecordedRotation,
	withReplayBudget,
} from './chaos-run.mjs'
import {
	appDataPath,
	bootedSimulator,
	buildForTesting,
	findXctestrun,
	installBuiltApp,
	run,
	testWithoutBuilding,
} from './uitest-run.mjs'

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
	checkOutputDir({options, out, exists: existsSync(out)})

	// A replay only reads the run it replays, so read all of it up front.
	let recorded = options.replay
		? {
				steps: stepLines(join(options.replay, 'attachments')),
				stop: stopReason(join(options.replay, 'attachments')),
				tapes: recordedTapes(options.replay, readdirSync(options.replay)),
			}
		: null
	if (recorded) {
		options = withRecordedRotation(withReplayBudget(options, recorded.steps), recorded.steps)
	}

	let problem = jsSourceProblem({env: process.env, hasEmbeddedBundle: builtAppHasBundle()})
	if (problem) {
		throw new Error(problem)
	}
	let location = process.env.TEST_RUNNER_AAO_JS_LOCATION
	if (location) {
		let metro = metroProblem({
			location,
			projectRoot: metroProjectRoot(location),
			checkout: realpathSync(process.cwd()),
		})
		if (metro) {
			throw new Error(metro)
		}
	}

	let device = bootedSimulator()
	console.log(`chaos seed ${options.seed} on ${device.name} (${device.udid}) -> ${out}`)

	if (!options.prebuilt) {
		buildForTesting(device.udid)
	}

	installBuiltApp(device.udid)

	// A replay reads the recorded tapes from the app's Documents; a recording starts clean.
	let documents = appDataPath(device.udid, 'Documents')
	checkAppContainer({documents, replaying: recorded !== null, udid: device.udid})
	if (documents) {
		mkdirSync(documents, {recursive: true})
		for (let name of readdirSync(documents).filter(isRunFile)) {
			rmSync(join(documents, name), {force: true})
		}
		for (let name of recorded?.tapes ?? []) {
			copyFileSync(join(options.replay, name), join(documents, name))
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

	// A replay's tapes are the ones it was given, copied from the recording
	// rather than the app, which reads them but never writes to them.
	let documentsAfter = appDataPath(device.udid, 'Documents')
	let [tapeDir, tapes] = recorded
		? [options.replay, recorded.tapes]
		: [
				documentsAfter,
				tapeFiles(documentsAfter && existsSync(documentsAfter) ? readdirSync(documentsAfter) : []),
			]
	for (let name of tapes) {
		copyFileSync(join(tapeDir, name), join(out, name))
	}
	let findingsInApp = documentsAfter && join(documentsAfter, FINDINGS_FILE)
	if (findingsInApp && existsSync(findingsInApp)) {
		copyFileSync(findingsInApp, join(out, FINDINGS_FILE))
	}
	// A run that failed early may leave no result bundle; what it did leave
	// still decides the outcome below.
	let attachmentsError = null
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
		attachmentsError = error.stderr || error.message
		console.warn(`could not export the run's attachments: ${attachmentsError}`)
	}
	nameAttachments(join(out, 'attachments'))

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
	let findingsPath = join(out, FINDINGS_FILE)
	let findingLines = existsSync(findingsPath) ? readFileSync(findingsPath, 'utf8').split('\n') : []
	let outcome = runOutcome({
		testFailed: testError !== null,
		stepCount: steps.length,
		stopReason: stop,
		stoppingFindings: stoppingFindings(findingLines),
		attachmentsError,
	})
	if (outcome.exitCode === 2 && testError) {
		console.error(testError.message)
		for (let message of resultFailures(resultBundle)) {
			console.error(message)
		}
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

/**
 * Whether a simulator build of the app carries its JavaScript inside it, as a
 * CI build does. A local Debug build skips bundling and asks Metro instead.
 */
function builtAppHasBundle() {
	let products = 'ios/build/Build/Products'
	if (!existsSync(products)) return false
	return readdirSync(products)
		.filter((dir) => dir.endsWith('-iphonesimulator'))
		.some((dir) =>
			readdirSync(join(products, dir))
				.filter((name) => name.endsWith('.app'))
				.some((app) => existsSync(join(products, dir, app, 'main.jsbundle'))),
		)
}

/** Why the test itself failed, from its result bundle; empty when that can't be read. */
function resultFailures(resultBundle) {
	try {
		let json = run(
			'xcrun',
			['xcresulttool', 'get', 'test-results', 'tests', '--path', resultBundle],
			{
				stdio: 'pipe',
			},
		)
		return testFailureMessages(JSON.parse(json))
	} catch {
		return []
	}
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

/** The checkout the Metro at `location` serves, or null when nothing answers there. */
function metroProjectRoot(location) {
	try {
		let headers = run(
			'curl',
			['-s', '-D', '-', '-o', '/dev/null', '--max-time', '5', `http://${location}/status`],
			{stdio: ['ignore', 'pipe', 'ignore']},
		)
		return headers.match(/^x-react-native-project-root: *(.+?)\r?$/imu)?.[1] ?? null
	} catch {
		return null
	}
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

/**
 * Renames each exported attachment in `dir` from xcresulttool's UUID to the
 * name it was attached under, and points the manifest at the new names, so
 * `attachmentText` still finds them.
 */
function nameAttachments(dir) {
	let manifestPath = join(dir, 'manifest.json')
	if (!existsSync(manifestPath)) return
	let manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
	let names = readableAttachmentNames(manifest)
	for (let attachment of manifest.flatMap((test) => test.attachments)) {
		let name = names.get(attachment.exportedFileName)
		renameSync(join(dir, attachment.exportedFileName), join(dir, name))
		attachment.exportedFileName = name
	}
	writeFileSync(manifestPath, `${JSON.stringify(manifest, null, '\t')}\n`)
}
