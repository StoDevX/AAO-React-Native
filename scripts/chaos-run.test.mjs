import assert from 'node:assert/strict'
import {test} from 'node:test'

import {
	chaosOutputDir,
	firstDivergence,
	parseChaosArgs,
	parseDuration,
	parseFindingLines,
	REPLAY_DURATION,
	replayVerdict,
	runOutcome,
	stoppingFindings,
	testEnv,
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
		]),
		{seed: 42, steps: 100, duration: 1200, faultRate: '0.5', replay: null, prebuilt: true},
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

test('refuses an unknown flag', () => {
	assert.throws(() => parseChaosArgs(['--sed', '1']), /--sed/u)
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
