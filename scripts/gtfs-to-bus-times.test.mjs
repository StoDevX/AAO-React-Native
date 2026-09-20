import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {daysForService, selectRoutes} from './gtfs-to-bus-times.mjs'

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
