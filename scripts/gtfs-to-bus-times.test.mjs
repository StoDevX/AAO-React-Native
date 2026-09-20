import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
	alignRow,
	canonicalPattern,
	daysForService,
	formatTime,
	selectRoutes,
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

	it('throws when a pattern is not a subsequence, rather than emitting plausible wrong times', () => {
		let full = [s('a'), s('b'), s('c')]

		assert.throws(() => canonicalPattern([[s('c'), s('a')], full]), /not a subsequence/u)
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
})
