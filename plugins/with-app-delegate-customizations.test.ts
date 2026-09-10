import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {describe, it} from 'node:test'

import {patchAppDelegate} from './with-app-delegate-customizations.ts'

// The stock file expo prebuild writes, taken verbatim from
// expo-template-bare-minimum. Regenerate it after an SDK bump: the transform
// anchors on this text and throws when the anchors move.
const STOCK = readFileSync(join(import.meta.dirname, 'fixtures/AppDelegate.swift'), 'utf8')

describe('patchAppDelegate', () => {
	it('imports AVFoundation', () => {
		assert.ok(patchAppDelegate(STOCK).includes('import AVFoundation'))
	})

	it('configures the shared URLCache', () => {
		assert.ok(patchAppDelegate(STOCK).includes('URLCache.shared = urlCache'))
	})

	it('sets the audio session to playback so the silent switch is ignored', () => {
		assert.ok(
			patchAppDelegate(STOCK).includes('AVAudioSession.sharedInstance().setCategory(.playback)'),
		)
	})

	it('handles the --reset-state launch argument', () => {
		assert.ok(patchAppDelegate(STOCK).includes('--reset-state'))
	})

	it('leaves the default module name alone, matching what expo-router registers', () => {
		assert.ok(patchAppDelegate(STOCK).includes('withModuleName: "main"'))
	})

	it('prefers an injected jsbundle over Metro in debug builds', () => {
		let result = patchAppDelegate(STOCK)
		assert.ok(result.includes('forResource: "main", withExtension: "jsbundle"'))
		assert.ok(result.includes('forBundleRoot: "index"'))
		assert.ok(!result.includes('.expo/.virtual-metro-entry'))
	})

	it('is idempotent', () => {
		let once = patchAppDelegate(STOCK)
		assert.equal(patchAppDelegate(once), once)
	})

	// A substring anchor survives *deeper* indentation by accident; it is a
	// shallower template that breaks it.
	it('tolerates a reindented launch anchor', () => {
		let reindented = STOCK.replace(
			'    let delegate = ReactNativeDelegate()',
			'  let delegate = ReactNativeDelegate()',
		)
		assert.ok(patchAppDelegate(reindented).includes('URLCache.shared = urlCache'))
	})

	it('throws when the launch anchor is missing', () => {
		let withoutLaunch = STOCK.replaceAll('didFinishLaunchingWithOptions', '')
		assert.throws(() => patchAppDelegate(withoutLaunch), /didFinishLaunchingWithOptions/u)
	})

	it('throws when the import anchor is missing', () => {
		let withoutImport = STOCK.replace('internal import Expo', '')
		assert.throws(() => patchAppDelegate(withoutImport), /import Expo/u)
	})

	it('throws when the bundleURL anchor is missing', () => {
		let withoutBundleRoot = STOCK.replace('forBundleRoot: ".expo/.virtual-metro-entry"', '')
		assert.throws(() => patchAppDelegate(withoutBundleRoot), /forBundleRoot/u)
	})
})
