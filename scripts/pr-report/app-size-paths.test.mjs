import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {mkdtempSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {describe, it} from 'node:test'

import {archiveNeeded, isNativePath} from './app-size-paths.mjs'

describe('isNativePath', () => {
	for (let path of [
		'ios/Podfile',
		'assets/windmill.icon/icon.json',
		'images/icons/windmill-light.png',
		'modules/audio-route/ios/AudioRouteModule.swift',
		'modules/audio-route/expo-module.config.json',
		'react-native.config.js',
		'plugins/with-alternate-icons.ts',
		'app.config.ts',
		'package.json',
		'pnpm-lock.yaml',
		'pnpm-workspace.yaml',
		'patches/react-native.patch',
		'mise.toml',
		'scripts/pr-report/app-size.mjs',
		'.github/workflows/pr-report.yml',
	]) {
		it(`counts ${path}`, () => assert.equal(isNativePath(path), true))
	}

	for (let path of [
		'source/features/dining/store.ts',
		'app/(tabs)/index.tsx',
		'modules/audio-route/index.ts',
		'modules/audio-route/package.json',
		'plugins/with-alternate-icons.test.ts',
		'data/building-hours/1-3-stav.yaml',
		'scripts/pr-report/render.mjs',
		'.github/workflows/ios.yml',
	]) {
		it(`leaves out ${path}`, () => assert.equal(isNativePath(path), false))
	}
})

describe('archiveNeeded', () => {
	it('needs an archive when any file is native', () => {
		assert.equal(archiveNeeded(['README.md', 'app.config.ts']), true)
	})

	it('needs none when no file is native', () => {
		assert.equal(archiveNeeded(['README.md', 'source/lib/a.ts']), false)
	})

	it('needs one for an empty list, which means the diff could not be read', () => {
		assert.equal(archiveNeeded([]), true)
	})
})

describe('the command line', () => {
	it('prints needed=false for a file of non-native paths, ignoring blank lines', () => {
		let dir = mkdtempSync(join(tmpdir(), 'app-size-paths-'))
		let list = join(dir, 'changed.txt')
		writeFileSync(list, 'README.md\n\nsource/lib/a.ts\n')
		let out = execFileSync('node', [join(import.meta.dirname, 'app-size-paths.mjs'), list], {
			encoding: 'utf8',
		})
		assert.equal(out, 'needed=false\n')
	})
})
