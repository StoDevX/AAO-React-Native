import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
import {mkdtempSync, rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {test} from 'node:test'
import {fileURLToPath} from 'node:url'

function runNativeTest(name, sources, args = []) {
	let directory = mkdtempSync(join(tmpdir(), `radio-${name}-test-`))
	try {
		let binary = join(directory, name)
		let compile = spawnSync(
			'xcrun',
			[
				'swiftc',
				'-O',
				'-warnings-as-errors',
				...sources.map((source) =>
					fileURLToPath(new URL(`../modules/radio-scrub/${source}`, import.meta.url)),
				),
				'-o',
				binary,
			],
			{encoding: 'utf8'},
		)
		assert.equal(compile.status, 0, compile.error?.message ?? compile.stderr)
		let run = spawnSync(binary, args, {encoding: 'utf8'})
		assert.equal(run.status, 0, run.error?.message ?? run.stderr)
	} finally {
		rmSync(directory, {recursive: true, force: true})
	}
}

test(
	'the native visualizer preserves spectral energy and interpolates independently of refresh rate',
	{skip: process.platform !== 'darwin'},
	() => {
		runNativeTest('audio-visualization', [
			'ios/AudioVisualization.swift',
			'tests/audio-visualization.swift',
		])
	},
)

test(
	'the native record buffer reverses broadcast samples and preserves delayed playback',
	{skip: process.platform !== 'darwin'},
	() => {
		runNativeTest('record-buffer', [
			'ios/RecordBuffer.swift',
			'ios/EffectSettings.swift',
			'ios/PlaybackGate.swift',
			'tests/record-buffer.swift',
		])
	},
)

test(
	'the device MP3 decoder handles fragmented input and resamples stereo audio',
	{skip: process.platform !== 'darwin'},
	() => {
		let fixture = fileURLToPath(
			new URL('../modules/radio-scrub/tests/stereo-tone.mp3', import.meta.url),
		)
		runNativeTest('mp3-decoder', ['ios/MP3Decoder.swift', 'tests/mp3-decoder.swift'], [fixture])
	},
)

test(
	'the native PCM queue preserves samples across startup, underflow and ring wrapping',
	{skip: process.platform !== 'darwin'},
	() => {
		runNativeTest('pcm-buffer', [
			'ios/RecordBuffer.swift',
			'ios/PlaybackGate.swift',
			'ios/PCMBuffer.swift',
			'tests/pcm-buffer.swift',
		])
	},
)
