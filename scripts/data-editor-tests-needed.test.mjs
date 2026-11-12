import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {build} from 'esbuild'

import {dataEditorTestsNeeded} from './data-editor-tests-needed.mjs'

describe('dataEditorTestsNeeded', () => {
	it('runs when the app changed', () => {
		assert.equal(dataEditorTestsNeeded(['macos/DataEditor/DataEditor/AppModel.swift']), true)
	})

	it('runs when a script the helper bundles changed', () => {
		for (let file of [
			'scripts/data-editor-pipeline.ts',
			'scripts/data-editor-jsc/fs.js',
			'scripts/bundle-data.mjs',
			'scripts/build-data-editor-helper.mjs',
			'modules/schedules/index.ts',
		]) {
			assert.equal(dataEditorTestsNeeded([file]), true, file)
		}
	})

	/// Node, oxfmt and the helper's dependencies are pinned in these.
	it('runs when a pin changed', () => {
		for (let file of ['mise.lock', 'package.json', 'pnpm-lock.yaml']) {
			assert.equal(dataEditorTestsNeeded([file]), true, file)
		}
	})

	it('runs when its own workflow changed', () => {
		assert.equal(dataEditorTestsNeeded(['.github/workflows/data-editor.yml']), true)
	})

	/// The weekly scrapes change data/ alone; master's run still covers them.
	it('skips a change to the data alone', () => {
		assert.equal(dataEditorTestsNeeded(['data/building-hours/1-1-cage.yaml']), false)
	})

	it('skips a change to the phone app alone', () => {
		assert.equal(
			dataEditorTestsNeeded(['app/settings/index.tsx', 'source/lib/remote-images.ts']),
			false,
		)
	})

	it('skips a change to another script', () => {
		assert.equal(dataEditorTestsNeeded(['scripts/scrape-bonapp.mjs']), false)
	})

	/// A script the helper starts to import must start the tests too, or a change
	/// to it would reach the app untested.
	it('covers every repo file the helper bundles', async () => {
		let builds = await Promise.all(
			['scripts/data-editor-jsc/entry.mjs', 'scripts/bundle-data.mjs'].map((entry) =>
				build({
					entryPoints: [entry],
					bundle: true,
					write: false,
					metafile: true,
					platform: 'node',
					format: 'esm',
					logLevel: 'silent',
					external: ['oxfmt', 'esbuild'],
				}),
			),
		)
		let read = new Set(
			builds
				.flatMap(({metafile}) => Object.keys(metafile.inputs))
				.filter((file) => !file.includes('node_modules')),
		)
		assert.ok(read.size > 10, `read only ${[...read].join(', ')}`)
		assert.deepEqual(
			[...read].filter((file) => !dataEditorTestsNeeded([file])),
			[],
		)
	})

	it('runs when the diff could not be worked out', () => {
		assert.equal(dataEditorTestsNeeded([]), true)
	})
})
