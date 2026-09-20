/**
 * calendar.txt's column names, in the order the app's `days` array uses --
 * Monday first, Sunday last, matching every hand-written schedule in
 * data/bus-times/.
 */
const DAY_COLUMNS = [
	['monday', 'Mo'],
	['tuesday', 'Tu'],
	['wednesday', 'We'],
	['thursday', 'Th'],
	['friday', 'Fr'],
	['saturday', 'Sa'],
	['sunday', 'Su'],
]

/** The days of the week a calendar.txt service runs on. */
export function daysForService(calendarRow) {
	return DAY_COLUMNS.filter(([column]) => calendarRow[column] === '1').map(([, day]) => day)
}

/**
 * The feed's routes that curation asks for, keyed by route_id.
 *
 * Matching is by id because ids survive the renames that names do not; the
 * recorded `expect_name` is checked only so a rename is reported rather than
 * absorbed silently.
 */
export function selectRoutes(feed, curation) {
	let byId = new Map(feed.routes.map((route) => [route.route_id, route]))
	let routes = []
	let warnings = []

	for (let [routeId, config] of Object.entries(curation.routes)) {
		let gtfsRoute = byId.get(routeId)

		if (!gtfsRoute) {
			warnings.push(`route ${routeId} (${config.line}) is no longer in the feed`)
			continue
		}

		if (gtfsRoute.route_long_name !== config.expect_name) {
			warnings.push(
				`route ${routeId} is now named "${gtfsRoute.route_long_name}", not "${config.expect_name}"; update expect_name in _curation.yaml`,
			)
		}

		routes.push({routeId, config, gtfsRoute})
	}

	return {routes, warnings}
}

/**
 * A GTFS `HH:MM:SS` as the `h:mma` string the YAML and validator expect.
 *
 * GTFS lets a trip that runs past midnight report hour 24 or more, so the
 * hour wraps rather than producing "25:30am".
 */
export function formatTime(gtfsTime) {
	let [hours, minutes] = gtfsTime.split(':').map(Number)
	let hour24 = hours % 24
	let suffix = hour24 < 12 ? 'am' : 'pm'
	let hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12

	return `${hour12}:${String(minutes).padStart(2, '0')}${suffix}`
}

/**
 * A trip's published stops, in order.
 *
 * `timepoint === '1'` marks a time the operator commits to. The rest are
 * interpolated between timepoints, and in this feed they are the
 * route-deviation stops -- visited only on a phoned-ahead request -- so their
 * times promise a schedule that is not kept.
 */
export function timepointStops(tripStopTimes, stopsById) {
	return tripStopTimes
		.filter((row) => row.timepoint === '1')
		.sort((a, b) => Number(a.stop_sequence) - Number(b.stop_sequence))
		.map((row) => ({id: row.stop_id, name: stopsById.get(row.stop_id).stop_name}))
}

/** Whether `pattern` appears in `canonical` in order, allowing gaps. */
function isSubsequence(canonical, pattern) {
	let i = 0
	for (let stop of canonical) {
		if (i < pattern.length && pattern[i].id === stop.id) {
			i += 1
		}
	}
	return i === pattern.length
}

/**
 * The one stop list a schedule publishes, against which every trip is aligned.
 *
 * The longest pattern wins, and every other must be a subsequence of it. That
 * assertion is load-bearing: a stop inserted mid-route would otherwise align
 * by position and emit times that look plausible and are wrong.
 */
export function canonicalPattern(patterns) {
	let canonical = patterns.reduce((longest, p) => (p.length > longest.length ? p : longest))

	for (let pattern of patterns) {
		if (!isSubsequence(canonical, pattern)) {
			let names = pattern.map((s) => s.name).join(' -> ')
			throw new Error(
				`stop pattern [${names}] is not a subsequence of the canonical pattern; the route's trips cannot be aligned to one stop list`,
			)
		}
	}

	return canonical
}

/**
 * One trip's times, spread across the canonical stop list.
 *
 * Matching walks both lists forward and consumes the earliest match, which is
 * what makes a repeated stop resolve to the right position -- the Express
 * calls at Carleton twice in a trip, so matching by name or by first
 * occurrence would put a time on the wrong row.
 */
export function alignRow(canonical, pattern, times) {
	let row = []
	let i = 0

	for (let stop of canonical) {
		if (i < pattern.length && pattern[i].id === stop.id) {
			row.push(times[i])
			i += 1
		} else {
			row.push(false)
		}
	}

	return row
}
