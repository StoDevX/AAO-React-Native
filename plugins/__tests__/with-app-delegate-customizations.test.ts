import {readFileSync} from 'node:fs'
import {join} from 'node:path'

import {patchAppDelegate} from '../with-app-delegate-customizations'

// The stock file expo prebuild writes, taken verbatim from
// expo-template-bare-minimum. Regenerate it after an SDK bump: the transform
// anchors on this text and throws when the anchors move.
const STOCK = readFileSync(
	join(__dirname, 'fixtures/AppDelegate.swift'),
	'utf8',
)

describe('patchAppDelegate', () => {
	it('imports AVFoundation', () => {
		expect(patchAppDelegate(STOCK)).toContain('import AVFoundation')
	})

	it('configures the shared URLCache', () => {
		expect(patchAppDelegate(STOCK)).toContain('URLCache.shared = urlCache')
	})

	it('sets the audio session to playback so the silent switch is ignored', () => {
		expect(patchAppDelegate(STOCK)).toContain(
			'AVAudioSession.sharedInstance().setCategory(.playback)',
		)
	})

	it('handles the --reset-state launch argument', () => {
		expect(patchAppDelegate(STOCK)).toContain('--reset-state')
	})

	it('registers the module name the JS side registers', () => {
		expect(patchAppDelegate(STOCK)).toContain('withModuleName: "AllAboutOlaf"')
		expect(patchAppDelegate(STOCK)).not.toContain('withModuleName: "main"')
	})

	it('prefers an injected jsbundle over Metro in debug builds', () => {
		let result = patchAppDelegate(STOCK)
		expect(result).toContain('forResource: "main", withExtension: "jsbundle"')
		expect(result).toContain('forBundleRoot: "index"')
		expect(result).not.toContain('.expo/.virtual-metro-entry')
	})

	it('is idempotent', () => {
		let once = patchAppDelegate(STOCK)
		expect(patchAppDelegate(once)).toBe(once)
	})

	// A substring anchor survives *deeper* indentation by accident; it is a
	// shallower template that breaks it.
	it('tolerates a reindented launch anchor', () => {
		let reindented = STOCK.replace(
			'    let delegate = ReactNativeDelegate()',
			'  let delegate = ReactNativeDelegate()',
		)
		expect(patchAppDelegate(reindented)).toContain('URLCache.shared = urlCache')
	})

	it('throws when the launch anchor is missing', () => {
		let withoutLaunch = STOCK.replaceAll('didFinishLaunchingWithOptions', '')
		expect(() => patchAppDelegate(withoutLaunch)).toThrow(
			/didFinishLaunchingWithOptions/u,
		)
	})

	it('throws when the import anchor is missing', () => {
		let withoutImport = STOCK.replace('internal import Expo', '')
		expect(() => patchAppDelegate(withoutImport)).toThrow(/import Expo/u)
	})

	it('throws when the module-name anchor is missing', () => {
		let withoutModuleName = STOCK.replace('withModuleName: "main"', '')
		expect(() => patchAppDelegate(withoutModuleName)).toThrow(/withModuleName/u)
	})

	it('throws when the bundleURL anchor is missing', () => {
		let withoutBundleRoot = STOCK.replace(
			'forBundleRoot: ".expo/.virtual-metro-entry"',
			'',
		)
		expect(() => patchAppDelegate(withoutBundleRoot)).toThrow(/forBundleRoot/u)
	})
})
