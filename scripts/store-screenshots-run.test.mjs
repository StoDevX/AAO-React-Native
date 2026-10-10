import assert from 'node:assert/strict'
import {test} from 'node:test'

import {
	DEVICES,
	localOffset,
	parseScreenshotArgs,
	pngSize,
	screenshotDevice,
	sizeProblem,
	statusBarArgs,
	storeScreenshots,
} from './store-screenshots-run.mjs'

test('shoots both apps on both devices unless some are named', () => {
	assert.deepEqual(parseScreenshotArgs([]).variants, ['aao', 'carls'])
	assert.deepEqual(parseScreenshotArgs([]).devices, ['iphone', 'ipad'])
	assert.deepEqual(parseScreenshotArgs(['carls']).variants, ['carls'])
	assert.deepEqual(parseScreenshotArgs(['carls']).devices, ['iphone', 'ipad'])
	assert.deepEqual(parseScreenshotArgs(['ipad']).devices, ['ipad'])
	assert.deepEqual(parseScreenshotArgs(['ipad']).variants, ['aao', 'carls'])
	assert.equal(parseScreenshotArgs([]).prebuilt, false)
	assert.equal(parseScreenshotArgs(['--prebuilt', 'aao']).prebuilt, true)
})

test('refuses an app it has no screenshots for, and a flag it does not know', () => {
	assert.throws(() => parseScreenshotArgs(['aao-dev']), /aao-dev/u)
	assert.throws(() => parseScreenshotArgs(['--fast']), /--fast/u)
})

test("sets the status bar to the campus's wall clock at the frozen moment, wherever the Mac is", () => {
	// The simulator shows the time in the Mac's zone, so noon on campus is
	// handed over as noon in that zone.
	let args = statusBarArgs('UDID', '2026-09-05T12:00:00-05:00', '-07:00')
	assert.deepEqual(args.slice(0, 3), ['status_bar', 'UDID', 'override'])
	// simctl refuses an ISO time without milliseconds.
	assert.equal(args[args.indexOf('--time') + 1], '2026-09-05T12:00:00.000-07:00')
})

test("reads this Mac's offset from UTC on the frozen day, not today's", () => {
	// test:node runs in America/Chicago, on daylight time in September and standard in January.
	assert.equal(localOffset('2026-09-05T12:00:00-05:00'), '-05:00')
	assert.equal(localOffset('2026-01-05T12:00:00-06:00'), '-06:00')
})

/** A simulator as `simctl list devices -j` lists it, made for `device`. */
function simulator(device, fields) {
	return {
		name: DEVICES[device].name,
		deviceTypeIdentifier: DEVICES[device].type,
		isAvailable: true,
		state: 'Shutdown',
		...fields,
	}
}

test("uses a device's screenshot simulator when it exists, whatever its runtime", () => {
	let devices = {
		'com.apple.CoreSimulator.SimRuntime.iOS-18-4': [{name: 'aao', udid: 'A', state: 'Booted'}],
		'com.apple.CoreSimulator.SimRuntime.iOS-27-0': [
			simulator('iphone', {udid: 'B'}),
			simulator('ipad', {udid: 'C', state: 'Booted'}),
		],
	}
	assert.deepEqual(screenshotDevice(devices, 'iphone'), {udid: 'B', booted: false})
	assert.deepEqual(screenshotDevice(devices, 'ipad'), {udid: 'C', booted: true})
	assert.equal(screenshotDevice({runtime: []}, 'iphone'), null)
})

test('passes over a screenshot simulator whose runtime is gone', () => {
	let devices = {
		old: [simulator('iphone', {udid: 'A', isAvailable: false})],
		new: [simulator('iphone', {udid: 'B', state: 'Booted'})],
	}
	assert.deepEqual(screenshotDevice(devices, 'iphone'), {udid: 'B', booted: true})
})

test('passes over a simulator of the name that is another model', () => {
	let devices = {
		runtime: [
			simulator('iphone', {
				udid: 'A',
				deviceTypeIdentifier: 'com.apple.CoreSimulator.SimDeviceType.iPhone-17-Pro-Max',
			}),
		],
	}
	assert.equal(screenshotDevice(devices, 'iphone'), null)
})

/** One test's attachments, as xcresulttool's manifest.json lists them. */
function manifest(...names) {
	return [
		{
			attachments: names.map((name, i) => ({
				exportedFileName: `EXPORT-${i}.png`,
				suggestedHumanReadableName: name,
			})),
		},
	]
}

test('files each store screenshot under its app and device, by the name it was taken under', () => {
	let shots = storeScreenshots(
		manifest(
			'store aao 02-menus_0_369403D5-2FF0-496A-9162-D8310B06B0A2.png',
			'store carls 01-home_0_469403D5-2FF0-496A-9162-D8310B06B0A2.png',
		),
		'ipad',
	)
	assert.deepEqual(shots, [
		{from: 'EXPORT-0.png', to: 'aao/ipad/02-menus.png'},
		{from: 'EXPORT-1.png', to: 'carls/ipad/01-home.png'},
	])
})

test('leaves out what is not a store screenshot', () => {
	let shots = storeScreenshots(
		manifest('Failure - testHome_0_369403D5-2FF0-496A-9162-D8310B06B0A2.png'),
		'iphone',
	)
	assert.deepEqual(shots, [])
})

test('keeps the last take of a screenshot a retry took twice', () => {
	let shots = storeScreenshots(
		manifest(
			'store aao 01-home_0_369403D5-2FF0-496A-9162-D8310B06B0A2.png',
			'store aao 01-home_0_469403D5-2FF0-496A-9162-D8310B06B0A2.png',
		),
		'iphone',
	)
	assert.deepEqual(shots, [{from: 'EXPORT-1.png', to: 'aao/iphone/01-home.png'}])
})

/** The first 24 bytes of a PNG of this size. */
function pngHeader(width, height) {
	let header = Buffer.alloc(24)
	header.write('\u0089PNG\r\n\u001A\n', 0, 'latin1')
	header.writeUInt32BE(13, 8)
	header.write('IHDR', 12, 'latin1')
	header.writeUInt32BE(width, 16)
	header.writeUInt32BE(height, 20)
	return header
}

test("reads a PNG's size from its header", () => {
	assert.deepEqual(pngSize(pngHeader(1320, 2868)), {width: 1320, height: 2868})
	assert.throws(() => pngSize(Buffer.from('not a png, whatever its name says')), /PNG/u)
})

test('passes a screenshot of a size App Store Connect takes for its device', () => {
	assert.equal(sizeProblem('aao/iphone/01-home.png', {width: 1206, height: 2622}, 'iphone'), null)
	assert.equal(sizeProblem('aao/ipad/01-home.png', {width: 2064, height: 2752}, 'ipad'), null)
})

test('names a screenshot App Store Connect would refuse for its device, and its size', () => {
	// An iPhone's size is no good in the iPad's slot.
	let problem = sizeProblem('aao/ipad/01-home.png', {width: 1206, height: 2622}, 'ipad')
	assert.match(problem, /aao\/ipad\/01-home\.png/u)
	assert.match(problem, /1206x2622/u)
})
