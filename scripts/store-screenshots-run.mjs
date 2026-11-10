// What a store-screenshot run decides, kept apart from the simulator and
// xcodebuild so node:test can check it. See scripts/store-screenshots.mjs.

/** Each app's screenshot class in uitests/Screenshots/, by the variant that ships it. */
export const SCREENSHOT_CLASSES = {aao: 'StOlafStoreScreenshots', carls: 'CarletonStoreScreenshots'}

/**
 * The simulators the screenshots are taken on, each made by the first run that
 * wants it: the two sizes App Store Connect requires of an app for iPhone and
 * iPad, with the portrait sizes it takes for each.
 */
export const DEVICES = {
	iphone: {
		name: 'AAO Store Screenshots',
		type: 'com.apple.CoreSimulator.SimDeviceType.iPhone-17-Pro',
		slot: 'a 6.3-inch iPhone',
		sizes: ['1206x2622', '1179x2556'],
	},
	ipad: {
		name: 'AAO Store Screenshots iPad',
		type: 'com.apple.CoreSimulator.SimDeviceType.iPad-Pro-13-inch-M5-12GB',
		slot: 'a 13-inch iPad',
		sizes: ['2064x2752', '2048x2732'],
	},
}

export const SCREENSHOTS_HELP = `Take the App Store screenshots on a 6.3-inch iPhone and a 13-inch iPad, from the campus recordings.

usage: mise run screenshots [aao] [carls] [iphone] [ipad] [--prebuilt]

  aao, carls     The apps to shoot; both when none is named.
  iphone, ipad   The devices to shoot on; both when none is named.
  --prebuilt     Run the tests already built in ios/build.

Writes logs/screenshots/<app>/<device>/NN-<screen>.png.`

/** The run's options from its command line. */
export function parseScreenshotArgs(argv) {
	let variants = []
	let devices = []
	let prebuilt = false
	for (let arg of argv) {
		if (arg === '--prebuilt') {
			prebuilt = true
		} else if (arg in SCREENSHOT_CLASSES) {
			variants.push(arg)
		} else if (arg in DEVICES) {
			devices.push(arg)
		} else {
			let known = [...Object.keys(SCREENSHOT_CLASSES), ...Object.keys(DEVICES)].join(', ')
			throw new Error(`${arg} is none of ${known}, nor a flag this takes\n\n${SCREENSHOTS_HELP}`)
		}
	}
	return {
		variants: variants.length > 0 ? variants : Object.keys(SCREENSHOT_CLASSES),
		devices: devices.length > 0 ? devices : Object.keys(DEVICES),
		prebuilt,
	}
}

/**
 * `device`'s screenshot simulator among `simctl list devices -j`'s devices, or
 * null when a run has yet to make it.
 */
export function screenshotDevice(devicesByRuntime, device) {
	let {name, type} = DEVICES[device]
	let found = Object.values(devicesByRuntime)
		.flat()
		.find(
			(candidate) =>
				candidate.name === name && candidate.deviceTypeIdentifier === type && candidate.isAvailable,
		)
	return found ? {udid: found.udid, booted: found.state === 'Booted'} : null
}

/** The wall-clock part of an ISO moment, without its offset: "2026-09-05T12:00:00". */
const WALL_CLOCK = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/u

/** `n` as two digits. */
const pad = (n) => String(n).padStart(2, '0')

/** This Mac's offset from UTC, as "-05:00", when its clocks read `moment`'s wall-clock time. */
export function localOffset(moment) {
	let [, year, month, day, hour, minute, second] = WALL_CLOCK.exec(moment)
	let minutesEast = -new Date(year, month - 1, day, hour, minute, second).getTimezoneOffset()
	let size = Math.abs(minutesEast)
	return `${minutesEast < 0 ? '-' : '+'}${pad(Math.floor(size / 60))}:${pad(size % 60)}`
}

/**
 * simctl's arguments for a status bar every screenshot shares: the campus's
 * wall clock at the moment the app's clock is frozen at, a full signal and a
 * full battery. The simulator shows a time in the Mac's zone, `macOffset`
 * from UTC, so the campus's noon is handed over as the Mac's noon.
 */
export function statusBarArgs(udid, frozenMoment, macOffset) {
	// simctl takes an ISO time only with milliseconds and an offset.
	let time = `${WALL_CLOCK.exec(frozenMoment)[0]}.000${macOffset}`
	return [
		'status_bar',
		udid,
		'override',
		'--time',
		time,
		'--dataNetwork',
		'wifi',
		'--wifiMode',
		'active',
		'--wifiBars',
		'3',
		'--cellularMode',
		'active',
		'--cellularBars',
		'4',
		'--operatorName',
		'',
		'--batteryState',
		'discharging',
		'--batteryLevel',
		'100',
	]
}

/** A store screenshot's attachment name: "store <app> <NN-screen>", then xcresulttool's suffix. */
const STORE_SCREENSHOT = /^store (\w+) (\d{2}-[a-z-]+)_\d+_[0-9A-F-]{36}\.png$/iu

/**
 * Where each store screenshot in a manifest exported from a run on `device`
 * goes, as a path under the output folder. A test xcodebuild ran twice leaves
 * two takes of one screenshot, and the later is the one that passed.
 */
export function storeScreenshots(manifest, device) {
	let byPath = new Map()
	for (let attachment of manifest.flatMap((test) => test.attachments)) {
		let match = STORE_SCREENSHOT.exec(attachment.suggestedHumanReadableName)
		if (match) {
			byPath.set(`${match[1]}/${device}/${match[2]}.png`, attachment.exportedFileName)
		}
	}
	return [...byPath].map(([to, from]) => ({from, to}))
}

/**
 * The apps among `variants` that `shots` hold nothing of. A screenshot class
 * the Xcode project does not list runs no tests and fails none, so a run can
 * end clean with nothing taken.
 */
export function unshotVariants(shots, variants) {
	return variants.filter((variant) => !shots.some(({to}) => to.startsWith(`${variant}/`)))
}

/** A PNG's pixel size, from its header. */
export function pngSize(buffer) {
	if (buffer.length < 24 || buffer.toString('latin1', 12, 16) !== 'IHDR') {
		throw new Error('not a PNG')
	}
	return {width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20)}
}

/** Why App Store Connect would refuse a screenshot of this size from `device`, or null when it takes it. */
export function sizeProblem(path, {width, height}, device) {
	let {sizes, slot} = DEVICES[device]
	let size = `${width}x${height}`
	if (sizes.includes(size)) return null
	return `${path} is ${size}; App Store Connect takes ${sizes.join(', ')} for ${slot}`
}
