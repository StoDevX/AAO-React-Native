// Building and running the XCUITests against a booted simulator, for scripts
// that need a UI test run's side effects: update-mess-fixtures and chaos.

import {execFileSync} from 'node:child_process'
import {cpSync, existsSync, rmSync} from 'node:fs'
import {join} from 'node:path'

import {pickSimulator} from './mess-fixtures.mjs'

export const BUNDLE = 'NFMTHAZVS9.com.drewvolz.stolaf'

/** Whether stderr from simctl indicates the app is not installed. */
export function isNotInstalled(stderr) {
	return stderr.includes('No such file or directory')
}

export function run(command, args, options = {}) {
	return execFileSync(command, args, {encoding: 'utf8', ...options})
}

/** The booted simulator to use, or the one SIMULATOR_UDID names. */
export function bootedSimulator(udid = process.env.SIMULATOR_UDID) {
	return pickSimulator(bootedSimulators(), udid)
}

/** Every booted simulator. */
export function bootedSimulators() {
	let booted = JSON.parse(run('xcrun', ['simctl', 'list', 'devices', 'booted', '-j'])).devices
	return Object.values(booted).flat()
}

/**
 * A path inside the app's data container, asked for each time since a test
 * run reinstalls the app; null when the app is not installed yet.
 */
export function appDataPath(udid, relative) {
	try {
		let container = run('xcrun', ['simctl', 'get_app_container', udid, BUNDLE, 'data'], {
			stdio: 'pipe',
		})
		return join(container.trim(), relative)
	} catch (error) {
		if (isNotInstalled(error.stderr)) {
			return null
		}
		throw new Error(`Could not find app container: ${error.stderr}`)
	}
}

/** xcodebuild's arguments for building the app and UI tests for `udid`. */
export function buildArgs(udid) {
	return [
		'-workspace',
		'ios/AllAboutOlaf.xcworkspace',
		'-scheme',
		'AllAboutOlaf',
		'-configuration',
		'Debug',
		'-sdk',
		'iphonesimulator',
		'-derivedDataPath',
		'ios/build',
		'-destination',
		`platform=iOS Simulator,id=${udid}`,
		'-only-testing:AllAboutOlafUITests',
		'CODE_SIGN_IDENTITY=',
		'CODE_SIGNING_REQUIRED=NO',
		'CODE_SIGNING_ALLOWED=NO',
	]
}

/** Where `buildForTesting` leaves the app. */
export const BUILT_APP = 'ios/build/Build/Products/Debug-iphonesimulator/AllAboutOlaf.app'

/**
 * Puts the bundle `mise run bundle:ios` wrote, and its assets, into the built
 * app, which then runs without Metro; the CI shards do the same by hand.
 */
export function embedJsBundle(app = BUILT_APP) {
	let bundle = 'ios/AllAboutOlaf/main.jsbundle'
	if (!existsSync(bundle)) {
		throw new Error(`no ${bundle}; run mise run bundle:ios first`)
	}
	cpSync(bundle, join(app, 'main.jsbundle'))
	rmSync(join(app, 'assets'), {recursive: true, force: true})
	cpSync('ios/assets', join(app, 'assets'), {recursive: true})
}

/**
 * Installs the built app on `udid`. `build-for-testing` builds it without
 * installing it, so a simulator that has never run the tests has no data
 * container until this does; installing over an installed app keeps its data.
 */
export function installBuiltApp(udid, app = BUILT_APP) {
	if (!existsSync(app)) {
		throw new Error(`no built app at ${app}; run without --prebuilt to build it`)
	}
	run('xcrun', ['simctl', 'install', udid, app], {stdio: 'inherit'})
}

export function buildForTesting(udid) {
	run('xcodebuild', ['build-for-testing', ...buildArgs(udid)], {stdio: 'inherit'})
}

export function findXctestrun() {
	return run('find', ['ios/build/Build/Products', '-name', '*.xctestrun', '-print', '-quit']).trim()
}

/** xcodebuild's arguments for running `only` from a built `xctestrun`. */
export function testArgs({udid, xctestrun, only, resultBundle}) {
	return [
		'test-without-building',
		'-xctestrun',
		xctestrun,
		'-destination',
		`platform=iOS Simulator,id=${udid}`,
		...only.map((name) => `-only-testing:${name}`),
		...(resultBundle ? ['-resultBundlePath', resultBundle] : []),
	]
}

/** Runs the tests; throws when any fail. */
export function testWithoutBuilding(options) {
	run('xcodebuild', testArgs(options), {stdio: 'inherit', env: {...process.env, ...options.env}})
}
