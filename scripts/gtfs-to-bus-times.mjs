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
 * A trip's stop_times rows that are actually published, in departure order.
 *
 * `timepoint === '1'` marks a time the operator commits to. The rest are
 * interpolated between timepoints, and in this feed they are the
 * route-deviation stops -- visited only on a phoned-ahead request -- so their
 * times promise a schedule that is not kept.
 *
 * This is the one place that decides which rows count as published and how
 * they are ordered; `timepointStops` and `schedulesForRoute` both build from
 * it, so a trip's stop pattern and its times cannot silently disagree on
 * length or order -- `alignRow` would otherwise catch that too late, by
 * throwing on a real route.
 */
function publishedStopTimes(tripStopTimes) {
	return tripStopTimes
		.filter((row) => row.timepoint === '1')
		.sort((a, b) => Number(a.stop_sequence) - Number(b.stop_sequence))
}

/** A trip's published stops, in order. */
export function timepointStops(tripStopTimes, stopsById) {
	return publishedStopTimes(tripStopTimes).map((row) => ({
		id: row.stop_id,
		name: stopsById.get(row.stop_id).stop_name,
	}))
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
	if (patterns.length === 0) {
		throw new Error('canonicalPattern: no trip patterns given; the route has no trips to align')
	}

	let canonical = patterns.reduce((longest, p) => (p.length > longest.length ? p : longest))

	if (canonical.length === 0) {
		throw new Error(
			'canonicalPattern: every trip pattern is empty; the route would publish zero stops -- check that stop_times.txt sets timepoint',
		)
	}

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
	if (pattern.length !== times.length) {
		throw new Error(
			`alignRow: pattern has ${pattern.length} stop(s) but times has ${times.length} entries; they must describe the same trip`,
		)
	}

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

	if (i !== pattern.length) {
		throw new Error(
			`alignRow: ${pattern.length - i} stop(s) in the trip's pattern were never matched against the canonical stop list; canonicalPattern should have rejected this pattern as not a subsequence`,
		)
	}

	return row
}

/**
 * Repairs whose feed has moved past the version they were written against.
 *
 * A repair patches a bug in one published feed. Once Trillium publishes a new
 * one the bug may be fixed, and a repair that keeps applying silently
 * overrides good data -- so say so rather than letting it become permanent.
 */
export function staleRepairs(repairs, feedVersion) {
	return repairs
		.filter((repair) => repair.written_against !== feedVersion)
		.map(
			(repair) =>
				`repair "${repair.id}" was written against feed "${repair.written_against}" but the feed is now "${feedVersion}"; confirm it is still needed`,
		)
}

/** Groups an array into a Map keyed by `keyOf`. */
function groupBy(items, keyOf) {
	let groups = new Map()
	for (let item of items) {
		let key = keyOf(item)
		let group = groups.get(key)
		if (group) {
			group.push(item)
		} else {
			groups.set(key, [item])
		}
	}
	return groups
}

/** One route's schedules, one per distinct (days, stops, times) timetable. */
function schedulesForRoute(feed, routeId, stopsById, stopNames) {
	let calendarById = new Map(feed.calendar.map((row) => [row.service_id, row]))
	let stopTimesByTrip = groupBy(
		feed.stopTimes.filter((row) => row.trip_id),
		(row) => row.trip_id,
	)
	let routeTrips = feed.trips.filter((trip) => trip.route_id === routeId)
	let schedules = []

	for (let [serviceId, trips] of groupBy(routeTrips, (trip) => trip.service_id)) {
		let calendarRow = calendarById.get(serviceId)
		if (!calendarRow) {
			continue
		}

		let days = daysForService(calendarRow)
		if (days.length === 0) {
			continue
		}

		let rows = trips.map((trip) => {
			let tripStopTimes = stopTimesByTrip.get(trip.trip_id) ?? []
			// pattern and times both come from this one filtered-and-sorted
			// list, so they cannot disagree about which stops are published or
			// what order they fall in.
			let published = publishedStopTimes(tripStopTimes)
			return {
				pattern: published.map((row) => ({
					id: row.stop_id,
					name: stopsById.get(row.stop_id).stop_name,
				})),
				// The raw GTFS `HH:MM:SS` sorts correctly as a string; the
				// formatted `h:mma` does not -- '10:30am' sorts before '6:00am'
				// and '1:30pm' before both, which silently scrambles the
				// timetable's row order.
				firstDeparture: published[0]?.departure_time ?? '',
				times: published.map((row) => formatTime(row.departure_time)),
			}
		})

		rows.sort((a, b) => a.firstDeparture.localeCompare(b.firstDeparture))

		let canonical = canonicalPattern(rows.map((row) => row.pattern))

		schedules.push({
			days,
			stops: canonical.map((stop) => stopNames[stop.name] ?? stop.name),
			times: rows.map((row) => alignRow(canonical, row.pattern, row.times)),
		})
	}

	// Three Express service_ids carry the same timetable over different date
	// windows; without this the app renders that timetable three times.
	let seen = new Map()
	for (let schedule of schedules) {
		seen.set(JSON.stringify(schedule), schedule)
	}

	return [...seen.values()]
}

/** The `set` keys `gtfsToBusTimes` knows how to apply from a repair. */
const HANDLED_REPAIR_KEYS = new Set(['days', 'timezone'])

/** Whether `repair` targets `routeId` -- a repair with no `route` targets every route. */
function repairAppliesToRoute(repair, routeId) {
	return repair.route === undefined || repair.route === routeId
}

/**
 * Warns about `repairs:` entries that applied to nothing.
 *
 * A repair that names a route no longer being generated, or that sets a key
 * nothing reads, silently does nothing -- which looks identical to a repair
 * that worked. Say so, rather than let a future repair author trust
 * protection that isn't there.
 */
function ineffectiveRepairs(repairs, routeIds) {
	let warnings = []

	for (let repair of repairs) {
		if (repair.route !== undefined && !routeIds.has(repair.route)) {
			warnings.push(
				`repair "${repair.id}" names route ${repair.route}, which is not among the routes being generated; it had no effect`,
			)
			continue
		}

		let unhandled = Object.keys(repair.set ?? {}).filter((key) => !HANDLED_REPAIR_KEYS.has(key))
		if (unhandled.length > 0) {
			warnings.push(
				`repair "${repair.id}" sets ${unhandled.join(', ')}, which gtfsToBusTimes does not know how to apply; it had no effect`,
			)
		}
	}

	return warnings
}

/**
 * The single `stop_timezone` every stop a route serves agrees on.
 *
 * `undefined` means the route's stops disagree, or one of them never set the
 * column -- both are feed defects for the caller to warn about and fall back
 * from, rather than guess at.
 */
function timezoneForRoute(feed, routeId, stopsById) {
	let routeTripIds = new Set(
		feed.trips.filter((trip) => trip.route_id === routeId).map((trip) => trip.trip_id),
	)
	let stopIds = new Set(
		feed.stopTimes.filter((row) => routeTripIds.has(row.trip_id)).map((row) => row.stop_id),
	)

	let timezones = new Set()
	let sawMissing = false

	for (let stopId of stopIds) {
		let timezone = stopsById.get(stopId)?.stop_timezone
		if (timezone) {
			timezones.add(timezone)
		} else {
			sawMissing = true
		}
	}

	if (sawMissing || timezones.size !== 1) {
		return
	}

	return [...timezones][0]
}

/** Every curated route as a bus line, keyed by the file it is written to. */
export function gtfsToBusTimes(feed, {curation, repairs}) {
	let feedVersion = feed.feedInfo[0]?.feed_version ?? ''
	let stopsById = new Map(feed.stops.map((stop) => [stop.stop_id, stop]))
	let stopNames = curation.stop_names ?? {}

	let {routes, warnings} = selectRoutes(feed, curation)
	let routeIds = new Set(routes.map((route) => route.routeId))
	warnings = [
		...warnings,
		...staleRepairs(repairs.repairs, feedVersion),
		...ineffectiveRepairs(repairs.repairs, routeIds),
	]

	let files = new Map()
	// Collected across routes and reported once per repair, the same way
	// `staleRepairs` reports once per repair rather than once per route it
	// touches.
	let redundantTimezoneRepairs = new Set()

	for (let {routeId, config} of routes) {
		let schedules = schedulesForRoute(feed, routeId, stopsById, stopNames)

		for (let repair of repairs.repairs) {
			if (repairAppliesToRoute(repair, routeId) && repair.set?.days) {
				schedules = schedules.map((schedule) => ({...schedule, days: repair.set.days}))
			}
		}

		if (schedules.length === 0) {
			warnings.push(`route ${routeId} (${config.line}) produced no schedules`)
		}

		// agency.txt's agency_timezone is never read -- it says
		// America/Los_Angeles for this Minnesota operator, which is exactly
		// the bug the agency-timezone repair exists to correct. stops.txt's
		// per-stop stop_timezone is the real source of truth.
		let derivedTimezone = timezoneForRoute(feed, routeId, stopsById)
		let timezoneRepair = repairs.repairs.find(
			(repair) => repairAppliesToRoute(repair, routeId) && repair.set?.timezone !== undefined,
		)

		if (derivedTimezone === undefined) {
			warnings.push(
				`route ${routeId} (${config.line})'s stops disagree on stop_timezone, or one of them never set it; falling back to a repair`,
			)
		} else if (timezoneRepair && timezoneRepair.set.timezone === derivedTimezone) {
			redundantTimezoneRepairs.add(timezoneRepair.id)
		}

		// A repair's timezone always wins over the value derived from
		// stops.txt -- that is the point of a repair -- but the derived
		// value still backstops a route that no timezone repair targets.
		let timezone = timezoneRepair?.set.timezone ?? derivedTimezone

		files.set(config.file, {
			line: config.line,
			timezone,
			colors: config.colors,
			notice: config.notice,
			schedules,
		})
	}

	for (let repairId of redundantTimezoneRepairs) {
		warnings.push(
			`repair "${repairId}" sets a timezone that already matches stops.txt; it may be redundant now that the feed provides the correct value`,
		)
	}

	return {files, warnings}
}
