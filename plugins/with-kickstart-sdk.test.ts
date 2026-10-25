import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {describe, it} from 'node:test'

import xcode from 'xcode'
import type {XcodeProject} from 'xcode'

import {addKickstartSdkPackage, startKickstartSignal} from './with-kickstart-sdk.ts'

const API_KEY = 'ks_live_test'

const STOCK_APP_DELEGATE = readFileSync(
	join(import.meta.dirname, 'fixtures/AppDelegate.swift'),
	'utf8',
)

function loadProject(): XcodeProject {
	let project = xcode.project(join(import.meta.dirname, 'fixtures/project.pbxproj'))
	project.parseSync()
	return project
}

type Reference = {value: string; comment?: string}

/** A pbxproj section's records, without the interleaved comments. */
function records(project: XcodeProject, name: string): Record<string, Record<string, unknown>> {
	return Object.fromEntries(
		Object.entries(project.hash.project.objects[name] ?? {}).filter(
			([key]) => !key.endsWith('_comment'),
		),
	) as Record<string, Record<string, unknown>>
}

function targetProducts(project: XcodeProject, target: string): Reference[] {
	let native = project.pbxNativeTargetSection()[project.findTargetKey(target) as string]
	if (typeof native === 'string') throw new Error('no target')
	return native.packageProductDependencies as Reference[]
}

describe('addKickstartSdkPackage', () => {
	// A build must not move with the package's main branch.
	it('pins the package to a release and links only KickstartSignal', () => {
		let project = addKickstartSdkPackage(loadProject(), 'AllAboutAnything')

		let [reference] = Object.values(records(project, 'XCRemoteSwiftPackageReference'))
		let requirement = (reference?.requirement ?? {}) as {kind?: string; version?: string}
		assert.equal(requirement.kind, 'exactVersion')
		assert.match(requirement.version ?? '', /^\d+\.\d+\.\d+$/u)

		let products = Object.values(records(project, 'XCSwiftPackageProductDependency'))
		assert.deepEqual(
			products.map((product) => product.productName),
			['KickstartSignal'],
		)
		assert.deepEqual(
			targetProducts(project, 'AllAboutAnything').map((entry) => entry.comment),
			['KickstartSignal'],
		)
	})

	it('adds nothing the second time', () => {
		let project = addKickstartSdkPackage(loadProject(), 'AllAboutAnything')
		addKickstartSdkPackage(project, 'AllAboutAnything')

		assert.equal(Object.keys(records(project, 'XCRemoteSwiftPackageReference')).length, 1)
		assert.equal(targetProducts(project, 'AllAboutAnything').length, 1)
	})

	it('names the target when it is missing', () => {
		assert.throws(() => addKickstartSdkPackage(loadProject(), 'Missing'), /Missing/u)
	})
})

describe('startKickstartSignal', () => {
	it('imports the board and the module that shows it', () => {
		let patched = startKickstartSignal(STOCK_APP_DELEGATE, API_KEY)
		assert.match(patched, /^import KickstartSignal$/mu)
		assert.match(patched, /^internal import FeatureRequests$/mu)
	})

	// The module is a pod and cannot import the package, so the app target
	// hands it the board, inside the NavigationStack the board requires.
	it('hands the board to FeatureRequests inside a NavigationStack', () => {
		let patched = startKickstartSignal(STOCK_APP_DELEGATE, API_KEY)
		let hook = patched.slice(
			patched.indexOf('FeatureRequests.makeBoard'),
			patched.indexOf('let delegate'),
		)
		assert.match(hook, /NavigationStack \{[\s\S]*SignalBoardView\(apiKey: "ks_live_test"\)/u)
		assert.match(hook, /Button\(action: onBack\)/u)
	})

	it('adds nothing the second time', () => {
		let once = startKickstartSignal(STOCK_APP_DELEGATE, API_KEY)
		assert.equal(startKickstartSignal(once, API_KEY), once)
	})

	it('says so when the Expo template has moved', () => {
		assert.throws(() => startKickstartSignal('// nothing', API_KEY), /AppDelegate\.swift/u)
	})
})
