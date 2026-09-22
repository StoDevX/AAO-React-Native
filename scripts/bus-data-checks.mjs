/**
 * Finds `line:` values published by more than one file.
 *
 * Takes `{file, line}` pairs -- the caller reads `data/bus-times/` and each
 * file's `line:` field -- and returns the groups that collide, leaving it to
 * the caller to read the directory and to throw. This is what would have
 * caught the bug that prompted it: `_curation.yaml` pointed `file:` at
 * pre-rename names while the renamed files already held generated content,
 * so a refresh would have written `blue-line.yaml` alongside
 * `4-blue-line.yaml` -- both claiming "Blue Line" -- and `bundleDataDir`
 * would publish the line twice.
 */
export function findDuplicateLines(entries) {
	let filesByLine = new Map()

	for (let {file, line} of entries) {
		let siblings = filesByLine.get(line)
		if (siblings) {
			siblings.push(file)
		} else {
			filesByLine.set(line, [file])
		}
	}

	return [...filesByLine]
		.filter(([, files]) => files.length > 1)
		.map(([line, files]) => ({line, files}))
}

/**
 * `now`'s date as GTFS's YYYYMMDD, read in the feed's own calendar.
 *
 * `feed_end_date` is the operator's local date, not UTC, so comparing it
 * against `now.toISOString()` can flip a day early or late near UTC
 * midnight. Every stop this feed publishes is America/Chicago.
 */
export function todayInChicago(now) {
	return new Intl.DateTimeFormat('en-CA', {timeZone: 'America/Chicago'})
		.format(now)
		.replaceAll('-', '')
}
