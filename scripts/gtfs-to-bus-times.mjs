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
 *
 * A route curation asks for and the feed no longer has is a hard error, not
 * a warning -- Trillium's numeric ids are not contractually stable, and a
 * feed that drops or renumbers a curated route must not be able to write
 * zero files, warn, and exit 0 while the app goes on serving stale data.
 */
export function selectRoutes(feed, curation) {
	let byId = new Map(feed.routes.map((route) => [route.route_id, route]))
	let routes = []
	let warnings = []

	for (let [routeId, config] of Object.entries(curation.routes)) {
		let gtfsRoute = byId.get(routeId)

		if (!gtfsRoute) {
			throw new Error(`route ${routeId} (${config.line}) is no longer in the feed`)
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

/**
 * Repairs whose self-imposed `expires` date has passed.
 *
 * `written_against` alone cannot catch every stale repair: the feed can keep
 * the same version indefinitely while the underlying condition a repair
 * patches has become stale for some other reason. `expires` is the author's
 * own deadline for a second look; a repair that quietly outlives it is the
 * same failure mode as one that outlives its feed version.
 */
export function expiredRepairs(repairs, today) {
	return repairs
		.filter((repair) => repair.expires !== undefined && repair.expires < today)
		.map(
			(repair) =>
				`repair "${repair.id}" expired on ${repair.expires} and it is now ${today}; confirm it is still needed`,
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

/**
 * A GTFS `stop_lat`/`stop_lon` field as a finite number, or a thrown error.
 *
 * `readFeed` fills an absent column with `''`, and `Number('')` is `0`, not
 * `NaN` -- so a stop missing coordinates would otherwise round-trip as a
 * silently plausible-looking `0`, putting a map pin in the Gulf of Guinea.
 * The empty-string check catches what `Number.isFinite` alone cannot.
 */
function parseCoordinate(rawValue, stopName, field) {
	let value = Number(rawValue)

	if (rawValue === '' || !Number.isFinite(value)) {
		throw new Error(`stop "${stopName}" has an invalid ${field} ("${rawValue}")`)
	}

	return value
}

/**
 * Every stop a schedule serves, keyed by the display name riders read.
 *
 * Keyed by display name rather than GTFS id because that is what
 * `processBusSchedule` looks up a timetable row's coordinates by. A stop
 * visited twice in one loop -- Blue calls at Northfield Depot both first and
 * last -- collapses to one entry, which is the same shape the hand-written
 * files already used.
 */
function coordinatesForStops(canonical, stopsById, stopNames) {
	return Object.fromEntries(
		canonical.map((stop) => {
			let gtfsStop = stopsById.get(stop.id)
			let displayName = stopNames[stop.name] ?? stop.name
			let lat = parseCoordinate(gtfsStop.stop_lat, stop.name, 'stop_lat')
			let lon = parseCoordinate(gtfsStop.stop_lon, stop.name, 'stop_lon')
			return [displayName, [lat, lon]]
		}),
	)
}

/** A GTFS `YYYYMMDD` date as the `YYYY-MM-DD` string the schema's `date` format expects. */
function formatGtfsDate(gtfsDate) {
	return `${gtfsDate.slice(0, 4)}-${gtfsDate.slice(4, 6)}-${gtfsDate.slice(6, 8)}`
}

/**
 * A service's holiday closures: its `calendar_dates.txt` REMOVED rows
 * (`exception_type` 2), sorted by date so the emitted YAML is stable across
 * runs regardless of the feed's row order.
 *
 * Every closure the feed lists is emitted, including dates already past --
 * filtering by "today" would make the generated files churn between weekly
 * runs for no benefit, since the app only ever asks about the current date.
 */
function closuresForService(feed, serviceId) {
	return feed.calendarDates
		.filter((row) => row.service_id === serviceId && row.exception_type === '2')
		.map((row) => ({date: formatGtfsDate(row.date), name: row.holiday_name}))
		.sort((a, b) => a.date.localeCompare(b.date))
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
			// pattern and times both come from the same published-stop
			// selection -- timepointStops and publishedStopTimes both filter
			// and sort tripStopTimes identically -- so they cannot disagree
			// about which stops are published or what order they fall in.
			let published = publishedStopTimes(tripStopTimes)
			return {
				pattern: timepointStops(tripStopTimes, stopsById),
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
		let closures = closuresForService(feed, serviceId)

		schedules.push({
			days,
			coordinates: coordinatesForStops(canonical, stopsById, stopNames),
			stops: canonical.map((stop) => stopNames[stop.name] ?? stop.name),
			times: rows.map((row) => alignRow(canonical, row.pattern, row.times)),
			// Omitted entirely rather than emitted empty, so a service with no
			// closures does not grow a `closures: []` key on every generated file.
			...(closures.length > 0 ? {closures} : {}),
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

/**
 * Whether `routeId`'s trips reference a service that `calendar_dates.txt`
 * adds (`exception_type` ADDED, `1`) rather than one `calendar.txt` defines.
 *
 * GTFS allows a feed to define a service entirely through `calendar_dates.txt`
 * and omit it from `calendar.txt` -- something `schedulesForRoute` does not
 * read. If a route's trips land here, its schedules are missing not because
 * the service is gone, but because this generator does not look where the
 * service is defined.
 */
function servedOnlyByCalendarDates(feed, routeId) {
	let routeServiceIds = new Set(
		feed.trips.filter((trip) => trip.route_id === routeId).map((trip) => trip.service_id),
	)
	let addedServiceIds = new Set(
		feed.calendarDates.filter((row) => row.exception_type === '1').map((row) => row.service_id),
	)

	return [...routeServiceIds].some((serviceId) => addedServiceIds.has(serviceId))
}

/** The `set` keys `gtfsToBusTimes` knows how to apply from a repair. */
const HANDLED_REPAIR_KEYS = new Set(['days'])

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
 * agency.txt's agency_timezone is deliberately never read here -- this feed
 * reports America/Los_Angeles for a Minnesota operator, so only the
 * per-stop stop_timezone in stops.txt can be trusted. A route whose stops
 * disagree, or one of which never set the column, has nothing trustworthy
 * to fall back to, so that is a hard error rather than a guess.
 */
function timezoneForRoute(feed, routeId, routeLabel, stopsById) {
	let routeTripIds = new Set(
		feed.trips.filter((trip) => trip.route_id === routeId).map((trip) => trip.trip_id),
	)
	let stopIds = new Set(
		feed.stopTimes.filter((row) => routeTripIds.has(row.trip_id)).map((row) => row.stop_id),
	)

	let timezoneByStop = new Map(
		[...stopIds].map((stopId) => [stopId, stopsById.get(stopId)?.stop_timezone ?? '']),
	)
	let distinct = new Set(timezoneByStop.values())

	if (distinct.size !== 1 || distinct.has('')) {
		let detail = [...timezoneByStop.entries()]
			.map(([stopId, timezone]) => `${stopId}: "${timezone}"`)
			.join(', ')
		throw new Error(
			`${routeLabel}'s stops do not agree on a usable stop_timezone (${detail}); there is no repair to fall back to`,
		)
	}

	return [...distinct][0]
}

/** Every curated route as a bus line, keyed by the file it is written to. */
export function gtfsToBusTimes(
	feed,
	{
		curation,
		repairs,
		today = new Intl.DateTimeFormat('en-CA', {timeZone: 'America/Chicago'}).format(new Date()),
	},
) {
	let feedVersion = feed.feedInfo[0]?.feed_version ?? ''
	let stopsById = new Map(feed.stops.map((stop) => [stop.stop_id, stop]))
	let stopNames = curation.stop_names ?? {}

	let {routes, warnings} = selectRoutes(feed, curation)
	let routeIds = new Set(routes.map((route) => route.routeId))
	warnings = [
		...warnings,
		...staleRepairs(repairs.repairs, feedVersion),
		...expiredRepairs(repairs.repairs, today),
		...ineffectiveRepairs(repairs.repairs, routeIds),
	]

	let files = new Map()

	for (let {routeId, config} of routes) {
		let schedules = schedulesForRoute(feed, routeId, stopsById, stopNames)

		for (let repair of repairs.repairs) {
			if (repairAppliesToRoute(repair, routeId) && repair.set?.days) {
				schedules = schedules.map((schedule) => ({...schedule, days: repair.set.days}))
			}
		}

		// A route that produces zero schedules would otherwise write
		// `schedules: []` -- a file with nothing wrong the schema, the
		// validator, or the Jest gate can see. This is the same shape as the
		// Critical bug this branch already shipped once; make it a hard error.
		if (schedules.length === 0) {
			if (servedOnlyByCalendarDates(feed, routeId)) {
				throw new Error(
					`route ${routeId} (${config.line})'s service is defined only in calendar_dates.txt, which schedulesForRoute does not read; supporting it needs a code change there, not a curation edit`,
				)
			}
			throw new Error(`route ${routeId} (${config.line}) produced no schedules`)
		}

		let timezone = timezoneForRoute(feed, routeId, `route ${routeId} (${config.line})`, stopsById)

		files.set(config.file, {
			line: config.line,
			timezone,
			colors: config.colors,
			notice: config.notice,
			// Passed through only when curation sets it, so a generated line can
			// be retired the way Oles Go was, without hand-editing a file this
			// script overwrites on every run.
			...(config.hidden ? {hidden: config.hidden} : {}),
			schedules,
		})
	}

	return {files, warnings}
}

/** A line's schedules reduced to what a rider sees, for comparing two copies. */
function timetable(schedules) {
	return JSON.stringify((schedules ?? []).map(({days, stops, times}) => ({days, stops, times})))
}

/**
 * The watched routes -- ones kept by hand because the feed's copy was wrong --
 * that the feed runs again today, and whether its timetable now matches the
 * hand-kept file.
 *
 * Generated from today's services alone: a feed that brings a route back
 * usually still lists the services that lapsed, and those would make the
 * comparison fail however right the new timetable is.
 */
export function returningRoutes(feed, curation, handKept, today) {
	let found = []

	for (let [routeId, {line, file}] of Object.entries(curation.watched_routes ?? {})) {
		let serviceIds = new Set(
			feed.trips.filter((trip) => trip.route_id === routeId).map((trip) => trip.service_id),
		)
		let running = feed.calendar.filter(
			(row) => serviceIds.has(row.service_id) && row.start_date <= today && today <= row.end_date,
		)
		if (running.length === 0) {
			continue
		}

		let {files} = gtfsToBusTimes(
			{...feed, calendar: running},
			{
				curation: {stop_names: curation.stop_names, routes: {[routeId]: {line, file}}},
				repairs: {repairs: []},
			},
		)
		found.push({
			routeId,
			line,
			file,
			matches: timetable(files.get(file)?.schedules) === timetable(handKept.get(file)?.schedules),
		})
	}

	return found
}
