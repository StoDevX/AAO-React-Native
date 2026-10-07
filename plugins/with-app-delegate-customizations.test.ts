import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {describe, it} from 'node:test'

import {appendSceneDelegate, patchAppDelegate} from './with-app-delegate-customizations.ts'

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

	// The calendar reads from SQLite, so a reset that leaves the database behind
	// hands each test the events an earlier one wrote.
	it('clears the SQLite databases under --reset-state', () => {
		let result = patchAppDelegate(STOCK)
		let reset = result.slice(
			result.indexOf('--reset-state'),
			result.indexOf('// set up the requests cacher'),
		)
		assert.match(
			reset,
			/urls\(for: \.documentDirectory, in: \.userDomainMask\)[\s\S]*appendingPathComponent\("SQLite"\)/u,
		)
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

describe('appendSceneDelegate', () => {
	let result = appendSceneDelegate(patchAppDelegate(STOCK))

	// A quick action that launches the app arrives in the connection options,
	// not in AppDelegate's launch options, once the app has a scene manifest.
	it('opens the quick action a cold launch carries', () => {
		assert.match(result, /connectionOptions\.shortcutItem/u)
	})

	it('opens a quick action tapped while the app runs', () => {
		assert.match(
			result,
			/func windowScene\([\s\S]*performActionFor shortcutItem: UIApplicationShortcutItem/u,
		)
	})

	it('reads the route from the item the QuickActions module wrote', () => {
		assert.match(result, /userInfo\?\["href"\]/u)
	})

	// The dev variant has its own scheme; a hard-coded one would open the
	// production app instead.
	it('reads the scheme from CFBundleURLTypes', () => {
		assert.match(result, /CFBundleURLTypes[\s\S]*CFBundleURLSchemes/u)
	})

	// The Swift lives in a template literal, where a lone `\(` loses its
	// backslash and Swift's interpolation becomes literal text.
	it('interpolates the scheme and route into the URL', () => {
		assert.ok(result.includes('"\\(scheme)://\\(href.'))
	})

	// Only a UI test may run the window's animations fast: a user, or a chaos
	// run hunting for timing bugs, needs them at their real speed.
	it('speeds up the window only under --uitesting', () => {
		assert.match(
			result,
			/if ProcessInfo\.processInfo\.arguments\.contains\("--uitesting"\) \{\s*existing\.layer\.speed = \d+\s*\}/u,
		)
		assert.equal(result.match(/layer\.speed/gu)?.length, 1)
	})

	it('hard-codes no scheme', () => {
		assert.doesNotMatch(result, /AllAboutOlaf(Dev)?:\/\//u)
	})

	it('is idempotent', () => {
		assert.equal(appendSceneDelegate(result), result)
	})
})
