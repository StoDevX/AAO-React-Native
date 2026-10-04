import assert from 'node:assert/strict'
import {test} from 'node:test'

import {
	chaosOutputDir,
	checkAppContainer,
	checkOutputDir,
	isRunFile,
	recordedTapes,
	tapeFiles,
	firstDivergence,
	jsSourceProblem,
	metroProblem,
	parseChaosArgs,
	parseDuration,
	parseFindingLines,
	REPLAY_DURATION,
	replayVerdict,
	runOutcome,
	stoppingFindings,
	testEnv,
	readableAttachmentNames,
	testFailureMessages,
	withRecordedRotation,
	withReplayBudget,
} from './chaos-run.mjs'

test('reads durations in seconds, minutes and hours', () => {
	assert.equal(parseDuration('90'), 90)
	assert.equal(parseDuration('90s'), 90)
	assert.equal(parseDuration('10m'), 600)
	assert.equal(parseDuration('1h'), 3600)
	assert.throws(() => parseDuration('soon'), /duration/u)
})

test('defaults to a random seed, 10 minutes and 0.25', () => {
	let options = parseChaosArgs([])
	assert.ok(Number.isInteger(options.seed) && options.seed > 0)
	assert.equal(options.duration, 600)
	assert.equal(options.faultRate, '0.25')
	assert.equal(options.replay, null)
	assert.equal(options.overwrite, false)
	assert.equal(options.rotate, false)
})

test('reads every flag', () => {
	assert.deepEqual(
		parseChaosArgs([
			'--seed',
			'42',
			'--steps',
			'100',
			'--duration',
			'20m',
			'--fault-rate',
			'0.5',
			'--prebuilt',
			'--overwrite',
			'--rotate',
		]),
		{
			seed: 42,
			steps: 100,
			duration: 1200,
			faultRate: '0.5',
			replay: null,
			prebuilt: true,
			overwrite: true,
			rotate: true,
		},
	)
})

test('takes the seed from the run being replayed', () => {
	let options = parseChaosArgs(['--replay', 'logs/chaos/1234'])
	assert.equal(options.seed, 1234)
	assert.equal(options.replay, 'logs/chaos/1234')
})

test('takes the seed from the leading digits of a replay directory', () => {
	assert.equal(parseChaosArgs(['--replay', 'logs/chaos/1234-replay/']).seed, 1234)
	assert.throws(() => parseChaosArgs(['--replay', 'logs/chaos/latest']), /seed/u)
})

test('refuses a seed alongside a replay, which takes its own', () => {
	assert.throws(
		() => parseChaosArgs(['--seed', '5', '--replay', 'logs/chaos/1234']),
		/--seed and --replay/u,
	)
})

test('leaves a replay budget unset unless given, to follow the recording', () => {
	let options = parseChaosArgs(['--replay', 'logs/chaos/1234'])
	assert.equal(options.steps, null)
	assert.equal(options.duration, REPLAY_DURATION)
	let bounded = parseChaosArgs(['--replay', 'logs/chaos/1234', '--steps', '9', '--duration', '1m'])
	assert.equal(bounded.steps, 9)
	assert.equal(bounded.duration, 60)
})

test('a replay runs as many steps as the run it replays', () => {
	let options = parseChaosArgs(['--replay', 'logs/chaos/1234'])
	assert.equal(withReplayBudget(options, ['a', 'b', 'c']).steps, 3)
	assert.equal(withReplayBudget({...options, steps: 2}, ['a', 'b', 'c']).steps, 2)
	assert.equal(withReplayBudget(options, null).steps, 0)
})

test('writes a run under its seed and a replay beside the run it replays', () => {
	assert.equal(chaosOutputDir({seed: 42, replay: null}), 'logs/chaos/42')
	assert.equal(chaosOutputDir({seed: 1234, replay: 'logs/chaos/1234'}), 'logs/chaos/1234-replay')
	assert.throws(
		() => chaosOutputDir({seed: 1234, replay: 'logs/chaos/1234-replay/'}),
		/logs\/chaos\/1234/u,
	)
})

test('refuses a replay directory ending -replay in any case, on a case-insensitive filesystem', () => {
	assert.throws(
		() => chaosOutputDir({seed: 1234, replay: 'logs/chaos/1234-REPLAY'}),
		/logs\/chaos\/1234/u,
	)
})

test('refuses to record over an earlier run of the seed, naming it and --overwrite', () => {
	assert.throws(
		() =>
			checkOutputDir({
				options: {seed: 42, replay: null, overwrite: false},
				out: 'logs/chaos/42',
				exists: true,
			}),
		(error) => error.message.includes('logs/chaos/42') && error.message.includes('--overwrite'),
	)
})

test('records into a new directory, or over an old one with --overwrite', () => {
	checkOutputDir({
		options: {seed: 42, replay: null, overwrite: false},
		out: 'logs/chaos/42',
		exists: false,
	})
	checkOutputDir({
		options: {seed: 42, replay: null, overwrite: true},
		out: 'logs/chaos/42',
		exists: true,
	})
})

test('replays over an earlier replay without --overwrite', () => {
	checkOutputDir({
		options: {seed: 42, replay: 'logs/chaos/42', overwrite: false},
		out: 'logs/chaos/42-replay',
		exists: true,
	})
})

test("finds every launch's tape, in launch order", () => {
	assert.deepEqual(
		tapeFiles([
			'chaos-tape-10.jsonl',
			'chaos-findings.jsonl',
			'chaos-tape-2.jsonl',
			'chaos-tape-0.jsonl',
			'chaos-tape.jsonl',
			'chaos-tape-x.jsonl',
			'outcome.json',
		]),
		['chaos-tape-0.jsonl', 'chaos-tape-2.jsonl', 'chaos-tape-10.jsonl'],
	)
})

test("a replay reads the recording's per-launch tapes", () => {
	assert.deepEqual(recordedTapes('logs/chaos/7', ['chaos-tape-1.jsonl', 'chaos-tape-0.jsonl']), [
		'chaos-tape-0.jsonl',
		'chaos-tape-1.jsonl',
	])
})

test('refuses to replay a recording made before per-launch tapes', () => {
	assert.throws(
		() => recordedTapes('logs/chaos/7', ['chaos-tape.jsonl', 'chaos-findings.jsonl']),
		/logs\/chaos\/7 was recorded before per-launch tapes/u,
	)
})

test('refuses to replay a recording with no tape', () => {
	assert.throws(
		() => recordedTapes('logs/chaos/7', ['outcome.json']),
		/logs\/chaos\/7 has no tape/u,
	)
})

test('clears every file a run leaves in the app, a tape from before per-launch tapes included', () => {
	for (let name of [
		'chaos-findings.jsonl',
		'chaos-tape-0.jsonl',
		'chaos-tape-12.jsonl',
		'chaos-tape.jsonl',
	]) {
		assert.equal(isRunFile(name), true, name)
	}
	for (let name of ['notes.txt', 'chaos-steps.jsonl', 'chaos-tape-a.jsonl']) {
		assert.equal(isRunFile(name), false, name)
	}
})

test('refuses a replay when the app has no data container to stage its tape in', () => {
	assert.throws(
		() => checkAppContainer({documents: null, replaying: true, udid: 'ABC'}),
		/no data container on ABC.*replay/su,
	)
})

test("stages into the app's container when it has one, and records without one", () => {
	checkAppContainer({documents: '/x/Documents', replaying: true, udid: 'ABC'})
	checkAppContainer({documents: null, replaying: false, udid: 'ABC'})
})

test('refuses an unknown flag', () => {
	assert.throws(() => parseChaosArgs(['--sed', '1']), /--sed/u)
})

test('refuses a step count that is not a positive whole number', () => {
	for (let steps of ['0', '-3', '2.5', 'many', '']) {
		assert.throws(
			() => parseChaosArgs(['--steps', steps]),
			/--steps must be a positive whole number/u,
			steps,
		)
	}
	assert.equal(parseChaosArgs(['--steps', '1']).steps, 1)
})

test('refuses a fault rate outside 0 to 1', () => {
	for (let rate of ['-0.1', '1.5', 'half', '', '0x1']) {
		assert.throws(
			() => parseChaosArgs(['--fault-rate', rate]),
			/--fault-rate must be a number from 0 to 1/u,
			rate,
		)
	}
	assert.equal(parseChaosArgs(['--fault-rate', '0']).faultRate, '0')
	assert.equal(parseChaosArgs(['--fault-rate', '1']).faultRate, '1')
	assert.equal(parseChaosArgs(['--fault-rate', '.5']).faultRate, '0.5')
})

test('hands the run its settings through TEST_RUNNER_ variables', () => {
	assert.deepEqual(testEnv({seed: 7, steps: 10, duration: 60, faultRate: '0.1', replay: 'x'}), {
		TEST_RUNNER_AAO_CHAOS_SEED: '7',
		TEST_RUNNER_AAO_CHAOS_STEPS: '10',
		TEST_RUNNER_AAO_CHAOS_DURATION: '60',
		TEST_RUNNER_AAO_CHAOS_FAULT_RATE: '0.1',
		TEST_RUNNER_AAO_CHAOS_REPLAY: '1',
	})
})

test('finds the first step a replay did differently', () => {
	let a = [
		'{"step":0,"action":"tap","identifier":"x"}',
		'{"step":1,"action":"back","identifier":""}',
	]
	let b = [
		'{"step":0,"action":"tap","identifier":"x"}',
		'{"step":1,"action":"tap","identifier":"y"}',
	]
	assert.equal(firstDivergence(a, b), 1)
	assert.equal(firstDivergence(a, a), null)
	assert.equal(firstDivergence(a, a.slice(0, 1)), null)
})

let steps = (count) => Array.from({length: count}, (_, step) => `{"step":${step}}`)

test('a replay that stops as the recording did reproduced it', () => {
	assert.deepEqual(
		replayVerdict({
			recordedSteps: steps(3),
			recordedStop: 'js: fatal: boom',
			replaySteps: steps(3),
			replayStop: 'js: fatal: boom',
		}),
		{reproduced: true, message: 'reproduced: js: fatal: boom'},
	)
})

test('a replay that runs past the recorded stop did not reproduce it', () => {
	assert.deepEqual(
		replayVerdict({
			recordedSteps: steps(3),
			recordedStop: 'js: fatal: boom',
			replaySteps: steps(3),
			replayStop: null,
		}),
		{
			reproduced: false,
			message:
				'not reproduced: took all 3 recorded steps without stopping (recorded js: fatal: boom)',
		},
	)
})

test('a replay cut short before the recorded stop did not reach it', () => {
	assert.deepEqual(
		replayVerdict({
			recordedSteps: steps(3),
			recordedStop: 'js: fatal: boom',
			replaySteps: steps(2),
			replayStop: null,
		}),
		{reproduced: null, message: 'not reached: the replay ended after 2 of 3 recorded steps'},
	)
})

test('a replay that stops for another reason did not reproduce the recording', () => {
	assert.deepEqual(
		replayVerdict({
			recordedSteps: steps(3),
			recordedStop: 'js: fatal: boom',
			replaySteps: steps(2),
			replayStop: 'hang: nothing to press for 15 seconds',
		}),
		{
			reproduced: false,
			message:
				'not reproduced: stopped at step 2 with hang: nothing to press for 15 seconds (recorded js: fatal: boom)',
		},
	)
})

test('a replay that takes another step diverged, whatever it found', () => {
	let replaySteps = [...steps(1), '{"step":1,"other":true}']
	assert.deepEqual(
		replayVerdict({
			recordedSteps: steps(3),
			recordedStop: 'js: fatal: boom',
			replaySteps,
			replayStop: null,
		}),
		{reproduced: false, message: 'diverged at step 1'},
	)
})

test('a replay of a run that never stopped only follows its steps', () => {
	assert.deepEqual(
		replayVerdict({
			recordedSteps: steps(3),
			recordedStop: null,
			replaySteps: steps(3),
			replayStop: null,
		}),
		{reproduced: null, message: 'followed the recorded steps'},
	)
})

test('parses every finding, skipping a line torn by a crash mid-write', () => {
	assert.deepEqual(
		parseFindingLines(['{"kind":"fatal","message":"boom"}', '', '{"kind":"console-e']),
		[{kind: 'fatal', message: 'boom'}],
	)
})

test('picks out only the findings severe enough to stop a run', () => {
	let lines = [
		'{"kind":"console-error","message":"noisy"}',
		'{"kind":"divergence","message":"no recorded answer"}',
		'{"kind":"out-of-app","message":"left via Linking"}',
		'{"kind":"fatal","message":"boom"}',
	]
	assert.deepEqual(stoppingFindings(lines), [
		{kind: 'divergence', message: 'no recorded answer'},
		{kind: 'fatal', message: 'boom'},
	])
})

test('a stopping finding fails the run even when the test itself passed', () => {
	let findings = [{kind: 'fatal', message: 'boom'}]
	assert.deepEqual(
		runOutcome({testFailed: false, stepCount: 4, stopReason: null, stoppingFindings: findings}),
		{exitCode: 1, message: 'chaos found something:\nfatal: boom'},
	)
})

test('a stop after the probe answered is a finding', () => {
	assert.deepEqual(
		runOutcome({
			testFailed: true,
			stepCount: 4,
			stopReason: 'hang: nothing to press for 15 seconds',
			stoppingFindings: [],
		}),
		{exitCode: 1, message: 'chaos found something:\nhang: nothing to press for 15 seconds'},
	)
	assert.deepEqual(
		runOutcome({
			testFailed: true,
			stepCount: 0,
			stopReason: 'error screen: router_error_message',
			stoppingFindings: [],
		}),
		{exitCode: 1, message: 'chaos found something:\nerror screen: router_error_message'},
	)
})

test('a silent probe after a relaunch is a finding', () => {
	assert.equal(
		runOutcome({
			testFailed: true,
			stepCount: 7,
			stopReason: 'probe silent: no chaos.findings element',
			stoppingFindings: [],
		}).exitCode,
		1,
	)
})

test('a silent probe at the first launch means the run never started', () => {
	assert.deepEqual(
		runOutcome({
			testFailed: true,
			stepCount: 0,
			stopReason: 'probe silent: no chaos.findings element',
			stoppingFindings: [],
		}),
		{
			exitCode: 2,
			message: 'the chaos run did not start: probe silent: no chaos.findings element',
		},
	)
})

test('a failed test with no steps means the run never started', () => {
	assert.deepEqual(
		runOutcome({testFailed: true, stepCount: 0, stopReason: null, stoppingFindings: []}),
		{exitCode: 2, message: 'the chaos run did not start'},
	)
})

test('a passing test with no steps was blind, not clean', () => {
	assert.deepEqual(
		runOutcome({testFailed: false, stepCount: 0, stopReason: null, stoppingFindings: []}),
		{exitCode: 2, message: 'the chaos run did not start'},
	)
})

test('a failed test with steps and no stop reason is a finding', () => {
	assert.deepEqual(
		runOutcome({testFailed: true, stepCount: 4, stopReason: null, stoppingFindings: []}),
		{exitCode: 1, message: 'chaos found something'},
	)
})

test('a passing test with steps and no stopping findings found nothing', () => {
	assert.deepEqual(
		runOutcome({testFailed: false, stepCount: 4, stopReason: null, stoppingFindings: []}),
		{exitCode: 0, message: 'chaos found nothing'},
	)
})

test('an attachments export failure with nothing else to show for it never started', () => {
	assert.deepEqual(
		runOutcome({
			testFailed: false,
			stepCount: 0,
			stopReason: null,
			stoppingFindings: [],
			attachmentsError: 'xcresulttool exited 1',
		}),
		{
			exitCode: 2,
			message: "the run's attachments could not be read: xcresulttool exited 1",
		},
	)
})

test('an attachments export failure is still a finding when the test failed', () => {
	assert.deepEqual(
		runOutcome({
			testFailed: true,
			stepCount: 0,
			stopReason: null,
			stoppingFindings: [],
			attachmentsError: 'xcresulttool exited 1',
		}),
		{exitCode: 1, message: 'chaos found something'},
	)
})

test('an attachments export failure is still a finding when stopping findings exist', () => {
	assert.deepEqual(
		runOutcome({
			testFailed: false,
			stepCount: 0,
			stopReason: null,
			stoppingFindings: [{kind: 'fatal', message: 'boom'}],
			attachmentsError: 'xcresulttool exited 1',
		}),
		{exitCode: 1, message: 'chaos found something:\nfatal: boom'},
	)
})

test('accepts a named Metro or an embedded bundle as the JavaScript source', () => {
	assert.equal(
		jsSourceProblem({
			env: {TEST_RUNNER_AAO_JS_LOCATION: 'localhost:8081'},
			hasEmbeddedBundle: false,
		}),
		null,
	)
	assert.equal(jsSourceProblem({env: {}, hasEmbeddedBundle: true}), null)
})

test('refuses a run with no JavaScript source, naming the variable to set', () => {
	let problem = jsSourceProblem({env: {}, hasEmbeddedBundle: false})
	assert.match(problem, /TEST_RUNNER_AAO_JS_LOCATION=localhost:8091 mise run chaos/u)
	assert.match(problem, /mise run chaos:8081/u)
})

test('accepts a Metro serving this checkout', () => {
	assert.equal(
		metroProblem({location: 'localhost:8081', projectRoot: '/src/aao', checkout: '/src/aao'}),
		null,
	)
})

// Port 8081 belongs to whichever checkout started Metro first.
test('refuses a Metro serving another checkout, naming both', () => {
	let problem = metroProblem({
		location: 'localhost:8081',
		projectRoot: '/src/aao-other',
		checkout: '/src/aao',
	})
	assert.match(problem, /localhost:8081 serves \/src\/aao-other, not \/src\/aao/u)
})

test('refuses a Metro that does not answer', () => {
	let problem = metroProblem({location: 'localhost:8091', projectRoot: null, checkout: '/src/aao'})
	assert.match(problem, /No Metro answered at localhost:8091/u)
})

test('points out an AAO_JS_LOCATION missing its TEST_RUNNER_ prefix', () => {
	let problem = jsSourceProblem({
		env: {AAO_JS_LOCATION: 'localhost:8081'},
		hasEmbeddedBundle: false,
	})
	assert.match(problem, /AAO_JS_LOCATION is set without the TEST_RUNNER_ prefix/u)
})

test('collects the failure messages from xcresulttool test results', () => {
	let results = {
		testNodes: [
			{
				name: 'AllAboutOlaf',
				nodeType: 'Test Plan',
				children: [
					{
						name: 'testChaos()',
						nodeType: 'Test Case',
						children: [
							{name: 'failed: caught error: "No Metro was named"', nodeType: 'Failure Message'},
							{name: 'Test skipped: threw error', nodeType: 'Skip Message'},
						],
					},
				],
			},
		],
	}
	assert.deepEqual(testFailureMessages(results), ['failed: caught error: "No Metro was named"'])
	assert.deepEqual(testFailureMessages({}), [])
})

test('hands the run --rotate only when asked', () => {
	let base = {seed: 1, steps: 10, duration: 60, faultRate: '0.25', replay: null}
	assert.equal(testEnv({...base, rotate: false}).TEST_RUNNER_AAO_CHAOS_ROTATE, undefined)
	assert.equal(testEnv({...base, rotate: true}).TEST_RUNNER_AAO_CHAOS_ROTATE, '1')
})

/** A recorded step log line for `action`, with `label`. */
function step(action, label = '') {
	return JSON.stringify({action, label})
}

test('a replay rotates as the recording did, whatever it was told', () => {
	let turned = [step('tap'), step('rotate')]
	let stayed = [step('tap'), step('rotate', 'off')]
	assert.equal(withRecordedRotation({rotate: false}, turned).rotate, true)
	assert.equal(withRecordedRotation({rotate: true}, stayed).rotate, false)
})

test('a replay of a recording that never rotated keeps the flag it was given', () => {
	assert.equal(withRecordedRotation({rotate: true}, [step('tap')]).rotate, true)
	assert.equal(withRecordedRotation({rotate: false}, null).rotate, false)
})

/** One test's attachments, as xcresulttool's manifest.json lists them. */
function manifest(...names) {
	return [
		{
			attachments: names.map((name, i) => ({
				exportedFileName: `EXPORT-${i}.bin`,
				suggestedHumanReadableName: name,
			})),
		},
	]
}

test('names each attachment for what it is, without its UUID', () => {
	let names = readableAttachmentNames(
		manifest(
			'chaos-steps_0_1AAFA218-54BB-42E5-B847-A2EB09C46066.jsonl',
			'chaos stop screen (portrait)_0_369403D5-2FF0-496A-9162-D8310B06B0A2.png',
			'chaos-stop_0_369403D5-2FF0-496A-9162-D8310B06B0A3.txt',
		),
	)
	assert.deepEqual(
		[...names],
		[
			['EXPORT-0.bin', 'chaos-steps.jsonl'],
			['EXPORT-1.bin', 'chaos stop screen (portrait).png'],
			['EXPORT-2.bin', 'chaos-stop.txt'],
		],
	)
})

test('numbers a second attachment of the same name rather than overwrite the first', () => {
	let names = readableAttachmentNames(
		manifest(
			'chaos trapped screen (portrait)_0_369403D5-2FF0-496A-9162-D8310B06B0A2.png',
			'chaos trapped screen (portrait)_1_469403D5-2FF0-496A-9162-D8310B06B0A2.png',
		),
	)
	assert.deepEqual(
		[...names.values()],
		['chaos trapped screen (portrait).png', 'chaos trapped screen (portrait) 2.png'],
	)
})

test('keeps a name that has no UUID to drop', () => {
	assert.deepEqual([...readableAttachmentNames(manifest('notes.txt')).values()], ['notes.txt'])
})
