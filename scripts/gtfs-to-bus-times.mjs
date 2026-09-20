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
