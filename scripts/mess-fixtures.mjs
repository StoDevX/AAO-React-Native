// Olaf Messenger's UI-test fixtures: what a recording run of the Messenger tests
// fetched, keyed as source/features/mess/lib/fixtures.ts looks them up.

/** The recording's lines as the fixture table: `"<format> <href>"` to the answer. */
export function mergeRecordings(lines) {
	let table = {}
	for (let text of lines) {
		if (!text.trim()) continue
		let {href, format, body, status, code} = JSON.parse(text)
		// a failure keeps WordPress's code, which tells a page past the last from any other 400
		let failure = code === undefined ? {status} : {status, code}
		table[`${format} ${href}`] = status === undefined ? body : failure
	}
	return table
}

function byText(a, b) {
	return a.localeCompare(b)
}

/** The fixtures `after` adds and removes against `before`. */
export function summarizeKeys(before, after) {
	return {
		added: Object.keys(after)
			.filter((key) => !(key in before))
			.sort(byText),
		removed: Object.keys(before)
			.filter((key) => !(key in after))
			.sort(byText),
	}
}

/** Refuses a recording with nothing in it, which is a broken run, not a paper. */
export function checkRecording(table) {
	if (Object.keys(table).length === 0) {
		throw new Error('nothing was recorded; mess.json is left as it was')
	}
}

/**
 * The simulator to record on: the one `udid` names, or the only one booted. It refuses to
 * guess among several, since recording reinstalls the app on whichever it picks.
 */
export function pickSimulator(booted, udid) {
	if (udid) {
		let named = booted.find((device) => device.udid === udid)
		if (!named) throw new Error(`simulator ${udid} is not booted`)
		return named
	}
	if (booted.length === 0) throw new Error('boot a simulator with the app installed first')
	if (booted.length > 1) {
		let list = booted.map((device) => `${device.udid} (${device.name})`).join(', ')
		throw new Error(`several simulators are booted; name one with SIMULATOR_UDID: ${list}`)
	}
	return booted[0]
}
