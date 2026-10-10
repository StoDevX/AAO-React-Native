#!/usr/bin/env node

// Takes the App Store screenshots: runs uitests/Screenshots/ on a 6.3-inch
// iPhone and a 13-inch iPad simulator whose status bars are set the same for
// every one, and collects them into logs/screenshots/<app>/<device>/. Needs
// Metro, as any local UI test run.

import {copyFileSync, mkdirSync, readFileSync, rmSync} from 'node:fs'
import {dirname, join} from 'node:path'

import {
	DEVICES,
	localOffset,
	parseScreenshotArgs,
	pngSize,
	SCREENSHOT_CLASSES,
	SCREENSHOTS_HELP,
	screenshotDevice,
	sizeProblem,
	statusBarArgs,
	storeScreenshots,
} from './store-screenshots-run.mjs'
import {buildForTesting, findXctestrun, run, testWithoutBuilding} from './uitest-run.mjs'

const OUT = 'logs/screenshots'

try {
	main()
} catch (error) {
	console.error(error.message)
	process.exitCode = 1
}

function main() {
	let argv = process.argv.slice(2)
	if (argv.includes('--help') || argv.includes('-h')) {
		console.log(SCREENSHOTS_HELP)
		return
	}
	let options = parseScreenshotArgs(argv)
	// Said before the build, which the test would otherwise fail after.
	if (!process.env.TEST_RUNNER_AAO_JS_LOCATION) {
		throw new Error(
			'Name the Metro serving this checkout, e.g. TEST_RUNNER_AAO_JS_LOCATION=localhost:8081 mise run screenshots',
		)
	}

	// One build serves every simulator; only what a run retakes is cleared.
	let built = options.prebuilt
	let problems = []
	for (let device of options.devices) {
		let udid = bootScreenshotSimulator(device)
		console.log(
			`store screenshots for ${options.variants.join(' and ')} on ${DEVICES[device].name} (${udid})`,
		)
		if (!built) {
			buildForTesting(udid)
			built = true
		}
		for (let variant of options.variants) {
			rmSync(join(OUT, variant, device), {recursive: true, force: true})
		}
		problems.push(...shoot({device, udid, variants: options.variants}))
	}
	if (problems.length > 0) {
		throw new Error(problems.join('\n'))
	}
}

/**
 * Runs `variants`' screenshot classes on `device`'s simulator and files what
 * they attached. Returns what went wrong: a failed screen still leaves the
 * others' screenshots, so they are collected before the run fails.
 */
function shoot({device, udid, variants}) {
	let work = join(OUT, `.${device}`)
	let resultBundle = join(work, 'result.xcresult')
	let attachments = join(work, 'attachments')
	rmSync(work, {recursive: true, force: true})
	mkdirSync(work, {recursive: true})

	let problems = []
	run('xcrun', ['simctl', 'ui', udid, 'appearance', 'light'])
	let frozen = frozenMoment()
	run('xcrun', ['simctl', ...statusBarArgs(udid, frozen, localOffset(frozen))])
	try {
		testWithoutBuilding({
			udid,
			xctestrun: findXctestrun(),
			only: variants.map((variant) => `AllAboutAnythingUITests/${SCREENSHOT_CLASSES[variant]}`),
			resultBundle,
		})
	} catch {
		problems.push(
			`a screen failed on the ${device}, so its screenshot is missing; the test output above says which`,
		)
	} finally {
		run('xcrun', ['simctl', 'status_bar', udid, 'clear'])
	}

	run('xcrun', [
		'xcresulttool',
		'export',
		'attachments',
		'--path',
		resultBundle,
		'--output-path',
		attachments,
	])
	let manifest = JSON.parse(readFileSync(join(attachments, 'manifest.json'), 'utf8'))
	let shots = storeScreenshots(manifest, device)
	for (let {from, to} of shots) {
		let problem = sizeProblem(to, pngSize(readFileSync(join(attachments, from))), device)
		if (problem) problems.push(problem)
		mkdirSync(dirname(join(OUT, to)), {recursive: true})
		copyFileSync(join(attachments, from), join(OUT, to))
	}
	rmSync(work, {recursive: true, force: true})
	console.log(shots.map(({to}) => join(OUT, to)).join('\n'))
	return problems
}

/** `device`'s screenshot simulator's UDID, booted; a first run makes it. */
function bootScreenshotSimulator(device) {
	let devices = JSON.parse(run('xcrun', ['simctl', 'list', 'devices', '-j'])).devices
	let simulator = screenshotDevice(devices, device) ?? {
		udid: run('xcrun', ['simctl', 'create', DEVICES[device].name, DEVICES[device].type]).trim(),
		booted: false,
	}
	if (!simulator.booted) {
		run('xcrun', ['simctl', 'boot', simulator.udid])
	}
	run('xcrun', ['simctl', 'bootstatus', simulator.udid, '-b'], {stdio: 'ignore'})
	return simulator.udid
}

/** The moment the app's clock is frozen at under UI tests, so the status bar agrees with it. */
function frozenMoment() {
	let source = readFileSync(new URL('../modules/timer/index.ts', import.meta.url), 'utf8')
	let moment = /UITEST_FROZEN_DATE = '([^']+)'/u.exec(source)?.[1]
	if (!moment) throw new Error('no UITEST_FROZEN_DATE in modules/timer/index.ts')
	return moment
}
