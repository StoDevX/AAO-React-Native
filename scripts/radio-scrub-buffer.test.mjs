import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
import {mkdtempSync, rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {test} from 'node:test'
import {fileURLToPath} from 'node:url'

test('the native record buffer reverses broadcast samples and preserves delayed playback', () => {
	let directory = mkdtempSync(join(tmpdir(), 'radio-scrub-test-'))
	try {
		let binary = join(directory, 'record-buffer')
		let source = fileURLToPath(
			new URL('../modules/radio-scrub/tests/record-buffer.cpp', import.meta.url),
		)
		let compile = spawnSync(
			'c++',
			['-std=c++17', '-Wall', '-Wextra', '-Werror', source, '-o', binary],
			{
				encoding: 'utf8',
			},
		)
		assert.equal(compile.status, 0, compile.error?.message ?? compile.stderr)
		let run = spawnSync(binary, [], {encoding: 'utf8'})
		assert.equal(run.status, 0, run.error?.message ?? run.stderr)
	} finally {
		rmSync(directory, {recursive: true, force: true})
	}
})

test(
	'the device MP3 decoder handles fragmented input and resamples stereo audio',
	{skip: process.platform !== 'darwin'},
	() => {
		let directory = mkdtempSync(join(tmpdir(), 'radio-decoder-test-'))
		try {
			let binary = join(directory, 'mp3-decoder')
			let source = fileURLToPath(
				new URL('../modules/radio-scrub/tests/mp3-decoder.cpp', import.meta.url),
			)
			let fixture = fileURLToPath(
				new URL('../modules/radio-scrub/tests/stereo-tone.mp3', import.meta.url),
			)
			let compile = spawnSync(
				'c++',
				[
					'-std=c++17',
					'-Wall',
					'-Wextra',
					'-Werror',
					'-Wno-unused-parameter',
					source,
					'-framework',
					'AudioToolbox',
					'-o',
					binary,
				],
				{encoding: 'utf8'},
			)
			assert.equal(compile.status, 0, compile.error?.message ?? compile.stderr)
			let run = spawnSync(binary, [fixture], {encoding: 'utf8'})
			assert.equal(run.status, 0, run.error?.message ?? run.stderr)
		} finally {
			rmSync(directory, {recursive: true, force: true})
		}
	},
)
