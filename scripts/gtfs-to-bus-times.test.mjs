import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
	alignRow,
	canonicalPattern,
	daysForService,
	formatTime,
	gtfsToBusTimes,
	selectRoutes,
	staleRepairs,
	timepointStops,
} from './gtfs-to-bus-times.mjs'

/** One calendar.txt row; every day is off unless named. */
function service(...days) {
	let row = {
		service_id: 's1',
		monday: '0',
		tuesday: '0',
		wednesday: '0',
		thursday: '0',
		friday: '0',
		saturday: '0',
		sunday: '0',
	}
	for (let day of days) {
		row[day] = '1'
	}
	return row
}

describe('daysForService', () => {
	it('maps a weekday service', () => {
		let days = daysForService(service('monday', 'tuesday', 'wednesday', 'thursday', 'friday'))

		assert.deepEqual(days, ['Mo', 'Tu', 'We', 'Th', 'Fr'])
	})

	it('puts Sunday last, as the existing YAML does', () => {
		let days = daysForService(service('sunday', 'monday'))

		assert.deepEqual(days, ['Mo', 'Su'])
	})

	it('maps a no-Sunday school service', () => {
		let days = daysForService(
			service('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'),
		)

		assert.deepEqual(days, ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'])
	})

	it('returns nothing for a service that never runs', () => {
		assert.deepEqual(daysForService(service()), [])
	})
})

describe('selectRoutes', () => {
	let curation = {
		routes: {
			77627: {expect_name: 'Blue - Northfield', file: 'blue-line.yaml', line: 'Blue Line'},
		},
	}

	it('picks only the curated routes', () => {
		let feed = {
			routes: [
				{route_id: '77627', route_long_name: 'Blue - Northfield'},
				{route_id: '77624', route_long_name: 'Blue - Faribault'},
			],
		}

		let {routes, warnings} = selectRoutes(feed, curation)

		assert.equal(routes.length, 1)
		assert.equal(routes[0].routeId, '77627')
		assert.equal(routes[0].config.line, 'Blue Line')
		assert.deepEqual(warnings, [])
	})

	it('warns but still publishes when a curated route is renamed upstream', () => {
		let feed = {routes: [{route_id: '77627', route_long_name: 'Blue - Northfield Loop'}]}

		let {routes, warnings} = selectRoutes(feed, curation)

		assert.equal(routes.length, 1)
		assert.equal(warnings.length, 1)
		assert.match(warnings[0], /77627/u)
		assert.match(warnings[0], /Blue - Northfield Loop/u)
	})

	it('warns when a curated route has vanished from the feed', () => {
		let {routes, warnings} = selectRoutes({routes: []}, curation)

		assert.deepEqual(routes, [])
		assert.equal(warnings.length, 1)
		assert.match(warnings[0], /77627/u)
	})
})

describe('formatTime', () => {
	it('formats a morning time the way the YAML writes it', () => {
		assert.equal(formatTime('06:00:00'), '6:00am')
	})

	it('formats an afternoon time', () => {
		assert.equal(formatTime('13:05:00'), '1:05pm')
	})

	it('formats noon and midnight', () => {
		assert.equal(formatTime('12:00:00'), '12:00pm')
		assert.equal(formatTime('00:15:00'), '12:15am')
	})

	it('wraps a GTFS hour past midnight, which the spec allows', () => {
		assert.equal(formatTime('25:30:00'), '1:30am')
	})
})

describe('timepointStops', () => {
	let stopsById = new Map([
		['a', {stop_id: 'a', stop_name: 'Depot'}],
		['b', {stop_id: 'b', stop_name: "Jersey Mike's"}],
		['c', {stop_id: 'c', stop_name: 'Library'}],
	])

	it('keeps only timepoints, in stop_sequence order', () => {
		let rows = [
			{stop_id: 'c', stop_sequence: '3', timepoint: '1'},
			{stop_id: 'a', stop_sequence: '1', timepoint: '1'},
			{stop_id: 'b', stop_sequence: '2', timepoint: '0'},
		]

		assert.deepEqual(timepointStops(rows, stopsById), [
			{id: 'a', name: 'Depot'},
			{id: 'c', name: 'Library'},
		])
	})

	it('sorts stop_sequence numerically, not lexicographically, since Blue runs past 9', () => {
		let rows = [
			{stop_id: 'a', stop_sequence: '10', timepoint: '1'},
			{stop_id: 'c', stop_sequence: '2', timepoint: '1'},
		]

		assert.deepEqual(timepointStops(rows, stopsById), [
			{id: 'c', name: 'Library'},
			{id: 'a', name: 'Depot'},
		])
	})
})

describe('canonicalPattern', () => {
	let s = (id) => ({id, name: id.toUpperCase()})

	it('returns the only pattern when trips agree', () => {
		assert.deepEqual(canonicalPattern([[s('a'), s('b')]]), [s('a'), s('b')])
	})

	it('takes the longest pattern when a shorter one is a prefix, as the Express last trip is', () => {
		let six = [s('a'), s('b'), s('c')]
		let seven = [s('a'), s('b'), s('c'), s('d')]

		assert.deepEqual(canonicalPattern([six, seven]), seven)
	})

	it('accepts a pattern that skips a middle stop', () => {
		let full = [s('a'), s('b'), s('c')]

		assert.deepEqual(canonicalPattern([[s('a'), s('c')], full]), full)
	})

	it('matches repeated stops by position, not by first occurrence', () => {
		let full = [s('a'), s('b'), s('a')]

		assert.deepEqual(canonicalPattern([[s('a'), s('a')], full]), full)
	})

	it('throws instead of publishing zero stops when every pattern is empty', () => {
		// An omitted timepoint column would make timepointStops filter every
		// row away, so every pattern collapses to []; that must not silently
		// become a real, published schedule with no stops.
		assert.throws(() => canonicalPattern([[], []]), /zero stops/u)
	})

	it('throws with a clear message, rather than a bare reduce error, when given no patterns', () => {
		assert.throws(() => canonicalPattern([]), /no trip patterns/u)
	})

	it('throws when a pattern is not a subsequence, rather than emitting plausible wrong times', () => {
		let full = [s('a'), s('b'), s('c')]

		assert.throws(() => canonicalPattern([[s('c'), s('a')], full]), /not a subsequence/u)
	})

	it('throws for a backwards pattern even when two distinct stops share a display name', () => {
		// 'a' and 'c' are distinct stop_ids that both render as "Library", the
		// way "Library Nf" gets renamed to "Library" downstream of curation.
		let full = [
			{id: 'a', name: 'Library'},
			{id: 'b', name: 'Depot'},
			{id: 'c', name: 'Library'},
		]
		let backwards = [
			{id: 'c', name: 'Library'},
			{id: 'a', name: 'Library'},
		]

		assert.throws(() => canonicalPattern([backwards, full]), /not a subsequence/u)
	})
})

describe('alignRow', () => {
	let s = (id) => ({id, name: id.toUpperCase()})
	let canonical = [s('a'), s('b'), s('c'), s('d')]

	it('passes a full trip through unchanged', () => {
		let aligned = alignRow(canonical, canonical, ['6:00am', '6:05am', '6:10am', '6:15am'])

		assert.deepEqual(aligned, ['6:00am', '6:05am', '6:10am', '6:15am'])
	})

	it('marks a skipped trailing stop false, as the Express six-stop loop needs', () => {
		let aligned = alignRow(canonical, [s('a'), s('b'), s('c')], ['6:00am', '6:05am', '6:10am'])

		assert.deepEqual(aligned, ['6:00am', '6:05am', '6:10am', false])
	})

	it('marks a skipped middle stop false', () => {
		let aligned = alignRow(canonical, [s('a'), s('c'), s('d')], ['6:00am', '6:10am', '6:15am'])

		assert.deepEqual(aligned, ['6:00am', false, '6:10am', '6:15am'])
	})

	it('always returns one entry per canonical stop', () => {
		let aligned = alignRow(canonical, [s('a')], ['6:00am'])

		assert.equal(aligned.length, canonical.length)
	})

	it('matches a repeated stop_id by position, not by first occurrence, as the Express loop through Carleton needs', () => {
		let expressLoop = [s('carl'), s('olaf'), s('coop'), s('carl'), s('olaf')]
		let aligned = alignRow(expressLoop, [s('carl'), s('carl'), s('olaf')], ['x', 'y', 'z'])

		assert.deepEqual(aligned, ['x', false, false, 'y', 'z'])
	})

	it('matches by stop_id, not display name, since Library Nf renames to the same "Library" name', () => {
		let bothNamedLibrary = [
			{id: 'library', name: 'Library'},
			{id: 'library_nf', name: 'Library'},
		]
		let aligned = alignRow(bothNamedLibrary, [{id: 'library_nf', name: 'Library'}], ['6:10am'])

		assert.deepEqual(aligned, [false, '6:10am'])
	})

	it('throws when the pattern has more stops than the times row has entries', () => {
		assert.throws(() => alignRow(canonical, [s('a'), s('b')], ['6:00am']), /pattern/u)
	})

	it('throws when a stop in the pattern never matched the canonical list', () => {
		// canonicalPattern should reject this pattern before it reaches alignRow;
		// this pins the belt-and-suspenders check inside alignRow itself.
		assert.throws(
			() => alignRow(canonical, [s('c'), s('a')], ['6:10am', '6:00am']),
			/never matched/u,
		)
	})
})

/** A feed with one route, two identical services, and one trip each. */
function twoServiceFeed() {
	return {
		feedInfo: [{feed_version: 'v1'}],
		routes: [{route_id: 'r1', route_long_name: 'Test Route'}],
		calendar: [
			{
				service_id: 'sA',
				monday: '1',
				tuesday: '0',
				wednesday: '0',
				thursday: '0',
				friday: '0',
				saturday: '0',
				sunday: '0',
				start_date: '20260101',
				end_date: '20260601',
			},
			{
				service_id: 'sB',
				monday: '1',
				tuesday: '0',
				wednesday: '0',
				thursday: '0',
				friday: '0',
				saturday: '0',
				sunday: '0',
				start_date: '20260602',
				end_date: '20261201',
			},
		],
		trips: [
			{route_id: 'r1', service_id: 'sA', trip_id: 't1'},
			{route_id: 'r1', service_id: 'sB', trip_id: 't2'},
		],
		stops: [
			{
				stop_id: 'a',
				stop_name: 'Depot',
				stop_timezone: 'America/Chicago',
				stop_lat: '44.460',
				stop_lon: '-93.155',
			},
			{
				stop_id: 'b',
				stop_name: 'St Olaf College',
				stop_timezone: 'America/Chicago',
				stop_lat: '44.462',
				stop_lon: '-93.183',
			},
		],
		stopTimes: [
			{trip_id: 't1', stop_id: 'a', stop_sequence: '1', departure_time: '06:00:00', timepoint: '1'},
			{trip_id: 't1', stop_id: 'b', stop_sequence: '2', departure_time: '06:10:00', timepoint: '1'},
			{trip_id: 't2', stop_id: 'a', stop_sequence: '1', departure_time: '06:00:00', timepoint: '1'},
			{trip_id: 't2', stop_id: 'b', stop_sequence: '2', departure_time: '06:10:00', timepoint: '1'},
		],
		calendarDates: [],
		shapes: [],
		agency: [],
	}
}

let curation = {
	stop_names: {'St Olaf College': 'St. Olaf College'},
	routes: {
		r1: {
			expect_name: 'Test Route',
			file: 'test-line.yaml',
			line: 'Test Line',
			colors: {bar: 'rgb(1, 2, 3)', dot: 'rgb(4, 5, 6)'},
			notice: 'A test route.',
		},
	},
}

describe('gtfsToBusTimes', () => {
	it('writes the curated line name, colours and notice', () => {
		let {files} = gtfsToBusTimes(twoServiceFeed(), {curation, repairs: {repairs: []}})
		let line = files.get('test-line.yaml')

		assert.equal(line.line, 'Test Line')
		assert.deepEqual(line.colors, {bar: 'rgb(1, 2, 3)', dot: 'rgb(4, 5, 6)'})
		assert.equal(line.notice, 'A test route.')
	})

	it('renames stops for riders', () => {
		let {files} = gtfsToBusTimes(twoServiceFeed(), {curation, repairs: {repairs: []}})

		assert.deepEqual(files.get('test-line.yaml').schedules[0].stops, ['Depot', 'St. Olaf College'])
	})

	it('builds a coordinates map covering every distinct stop the schedule serves', () => {
		let {files} = gtfsToBusTimes(twoServiceFeed(), {curation, repairs: {repairs: []}})
		let schedule = files.get('test-line.yaml').schedules[0]

		assert.deepEqual(Object.keys(schedule.coordinates).sort(), schedule.stops.toSorted())
	})

	it('keys the coordinates map by the rider-facing name, not the GTFS name', () => {
		let {files} = gtfsToBusTimes(twoServiceFeed(), {curation, repairs: {repairs: []}})
		let schedule = files.get('test-line.yaml').schedules[0]

		assert.ok('St. Olaf College' in schedule.coordinates)
		assert.ok(!('St Olaf College' in schedule.coordinates))
	})

	it('gives each stop a numeric [lat, lon] pair', () => {
		let {files} = gtfsToBusTimes(twoServiceFeed(), {curation, repairs: {repairs: []}})
		let schedule = files.get('test-line.yaml').schedules[0]

		assert.deepEqual(schedule.coordinates.Depot, [44.46, -93.155])
		assert.deepEqual(schedule.coordinates['St. Olaf College'], [44.462, -93.183])
		for (let pair of Object.values(schedule.coordinates)) {
			assert.equal(pair.length, 2)
			assert.equal(typeof pair[0], 'number')
			assert.equal(typeof pair[1], 'number')
		}
	})

	it('collapses services whose timetables are identical, as the Express three do', () => {
		let {files} = gtfsToBusTimes(twoServiceFeed(), {curation, repairs: {repairs: []}})
		let schedules = files.get('test-line.yaml').schedules

		assert.equal(schedules.length, 1)
		assert.deepEqual(schedules[0].days, ['Mo'])
		assert.deepEqual(schedules[0].times, [['6:00am', '6:10am']])
	})

	it('keeps services apart when their timetables differ', () => {
		let feed = twoServiceFeed()
		feed.stopTimes[2].departure_time = '07:00:00'
		feed.stopTimes[3].departure_time = '07:10:00'

		let {files} = gtfsToBusTimes(feed, {curation, repairs: {repairs: []}})

		assert.equal(files.get('test-line.yaml').schedules.length, 2)
	})

	it('applies a repair that overrides a route schedule days', () => {
		let repairs = {
			repairs: [
				{
					id: 'test-days',
					reason: 'test',
					written_against: 'v1',
					expires: '2027-01-01',
					route: 'r1',
					set: {days: ['Mo', 'Tu']},
				},
			],
		}

		let {files} = gtfsToBusTimes(twoServiceFeed(), {curation, repairs})

		assert.deepEqual(files.get('test-line.yaml').schedules[0].days, ['Mo', 'Tu'])
	})

	it('orders rows by real departure time, not by their formatted string', () => {
		let feed = twoServiceFeed()
		// Two trips in one service, the later one listed first.
		feed.trips = [
			{route_id: 'r1', service_id: 'sA', trip_id: 't1'},
			{route_id: 'r1', service_id: 'sA', trip_id: 't2'},
		]
		feed.stopTimes = [
			{trip_id: 't1', stop_id: 'a', stop_sequence: '1', departure_time: '13:30:00', timepoint: '1'},
			{trip_id: 't1', stop_id: 'b', stop_sequence: '2', departure_time: '13:40:00', timepoint: '1'},
			{trip_id: 't2', stop_id: 'a', stop_sequence: '1', departure_time: '06:00:00', timepoint: '1'},
			{trip_id: 't2', stop_id: 'b', stop_sequence: '2', departure_time: '06:10:00', timepoint: '1'},
		]

		let {files} = gtfsToBusTimes(feed, {curation, repairs: {repairs: []}})
		let times = files.get('test-line.yaml').schedules[0].times

		// Sorting the formatted strings would put '1:30pm' before '6:00am'.
		assert.deepEqual(times, [
			['6:00am', '6:10am'],
			['1:30pm', '1:40pm'],
		])
	})

	it('never writes a file curation did not ask for', () => {
		let {files} = gtfsToBusTimes(twoServiceFeed(), {curation, repairs: {repairs: []}})

		assert.deepEqual([...files.keys()], ['test-line.yaml'])
	})

	it('warns when a repair names a route that is not among those being generated', () => {
		let repairs = {
			repairs: [
				{
					id: 'ghost-route',
					reason: 'test',
					written_against: 'v1',
					expires: '2027-01-01',
					route: 'does-not-exist',
					set: {days: ['Mo']},
				},
			],
		}

		let {warnings} = gtfsToBusTimes(twoServiceFeed(), {curation, repairs})

		assert.equal(warnings.length, 1)
		assert.match(warnings[0], /ghost-route/u)
		assert.match(warnings[0], /does-not-exist/u)
	})

	it('warns and names the key when a repair sets something the generator does not apply', () => {
		let repairs = {
			repairs: [
				{
					id: 'bad-key',
					reason: 'test',
					written_against: 'v1',
					expires: '2027-01-01',
					route: 'r1',
					set: {stops: ['a', 'b']},
				},
			],
		}

		let {warnings} = gtfsToBusTimes(twoServiceFeed(), {curation, repairs})

		assert.equal(warnings.length, 1)
		assert.match(warnings[0], /bad-key/u)
		assert.match(warnings[0], /stops/u)
	})

	it("takes the line's timezone from the stops the route serves", () => {
		let {files} = gtfsToBusTimes(twoServiceFeed(), {curation, repairs: {repairs: []}})

		assert.equal(files.get('test-line.yaml').timezone, 'America/Chicago')
	})

	it("ignores agency.txt's agency_timezone even when present and different", () => {
		let feed = twoServiceFeed()
		feed.agency = [{agency_id: '1', agency_timezone: 'America/Los_Angeles'}]

		let {files} = gtfsToBusTimes(feed, {curation, repairs: {repairs: []}})

		assert.equal(files.get('test-line.yaml').timezone, 'America/Chicago')
	})

	it("throws when a route's stops carry conflicting stop_timezone values", () => {
		let feed = twoServiceFeed()
		feed.stops[1].stop_timezone = 'America/New_York'

		assert.throws(
			() => gtfsToBusTimes(feed, {curation, repairs: {repairs: []}}),
			(error) => {
				assert.match(error.message, /no repair to fall back to/u)
				assert.match(error.message, /r1/u)
				assert.match(error.message, /America\/Chicago/u)
				assert.match(error.message, /America\/New_York/u)
				return true
			},
		)
	})

	it('throws when a stop the route serves has an empty stop_timezone', () => {
		let feed = twoServiceFeed()
		feed.stops[0].stop_timezone = ''
		feed.stops[1].stop_timezone = ''

		assert.throws(
			() => gtfsToBusTimes(feed, {curation, repairs: {repairs: []}}),
			(error) => {
				assert.match(error.message, /no repair to fall back to/u)
				assert.match(error.message, /r1/u)
				return true
			},
		)
	})

	it('warns that a set: {timezone} repair is unhandled now that the generator never applies one', () => {
		let repairs = {
			repairs: [
				{
					id: 'agency-timezone',
					reason: 'test',
					written_against: 'v1',
					expires: '2027-01-01',
					set: {timezone: 'America/Chicago'},
				},
			],
		}

		let {warnings} = gtfsToBusTimes(twoServiceFeed(), {curation, repairs})

		assert.equal(warnings.length, 1)
		assert.match(warnings[0], /agency-timezone/u)
		assert.match(warnings[0], /timezone/u)
	})
})

describe('staleRepairs', () => {
	let repair = {id: 'tz', reason: 'r', written_against: 'v1', expires: '2027-01-01', set: {}}

	it('says nothing while the feed is the one the repair was written against', () => {
		assert.deepEqual(staleRepairs([repair], 'v1'), [])
	})

	it('warns once the feed has moved on, so a repair cannot outlive its bug', () => {
		let warnings = staleRepairs([repair], 'v2')

		assert.equal(warnings.length, 1)
		assert.match(warnings[0], /tz/u)
		assert.match(warnings[0], /v2/u)
	})
})
