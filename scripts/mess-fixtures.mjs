// Olaf Messenger's UI-test fixtures: what a recording run of the Messenger tests
// fetched, keyed as source/features/mess/lib/fixtures.ts looks them up.

/** The recording's lines as the fixture table: `"<format> <href>"` to the answer. */
export function mergeRecordings(lines) {
	let table = {}
	for (let text of lines) {
		if (!text.trim()) continue
		let {href, format, body, status} = JSON.parse(text)
		table[`${format} ${href}`] = status === undefined ? body : {status}
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
