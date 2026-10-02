import assert from 'node:assert/strict'
import {test} from 'node:test'

import {firstDivergence, parseChaosArgs, parseDuration, testEnv} from './chaos-run.mjs'

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
