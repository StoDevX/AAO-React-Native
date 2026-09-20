import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {describe, it} from 'node:test'
import {parseCsv, readFeed} from './gtfs.mjs'

describe('parseCsv', () => {
	it('maps the header row onto each row', () => {
		let rows = parseCsv('stop_id,stop_name\n1,Depot\n2,Library\n')

		assert.deepEqual(rows, [
			{stop_id: '1', stop_name: 'Depot'},
			{stop_id: '2', stop_name: 'Library'},
		])
	})

	it('keeps a comma inside a quoted field, as stops.txt has', () => {
		let rows = parseCsv('stop_id,stop_name\n1,"Plainview, MN, USA"\n')

		assert.deepEqual(rows, [{stop_id: '1', stop_name: 'Plainview, MN, USA'}])
	})

	it('unescapes a doubled quote inside a quoted field', () => {
		let rows = parseCsv('stop_id,stop_name\n1,"The ""Depot"""\n')

		assert.deepEqual(rows, [{stop_id: '1', stop_name: 'The "Depot"'}])
	})

	it('reads empty trailing fields as empty strings', () => {
		let rows = parseCsv('a,b,c\n1,,\n')

		assert.deepEqual(rows, [{a: '1', b: '', c: ''}])
	})

	it('tolerates CRLF line endings', () => {
		let rows = parseCsv('a,b\r\n1,2\r\n')

		assert.deepEqual(rows, [{a: '1', b: '2'}])
	})

	it('strips a UTF-8 BOM, which GTFS publishers often emit', () => {
		let rows = parseCsv('﻿stop_id\n1\n')

		assert.deepEqual(rows, [{stop_id: '1'}])
	})

	it('skips blank lines', () => {
		let rows = parseCsv('a\n1\n\n2\n')

		assert.deepEqual(rows, [{a: '1'}, {a: '2'}])
	})
})

describe('readFeed', () => {
	let fixtureDir = path.join(import.meta.dirname, '__fixtures__', 'gtfs-threerivers')

	it('reads the nine GTFS keys, with the files the fixture has as row objects', () => {
		let feed = readFeed(fixtureDir)

		assert.deepEqual(Object.keys(feed), [
			'feedInfo',
			'agency',
			'routes',
			'trips',
			'stopTimes',
			'stops',
			'shapes',
			'calendar',
			'calendarDates',
		])

		assert.ok(feed.routes.length > 0)
		assert.equal(feed.routes[0].route_id, '77629')

		assert.ok(feed.trips.length > 0)
		assert.equal(feed.trips[0].route_id, '77627')

		assert.ok(feed.stopTimes.length > 0)
		assert.equal(feed.stopTimes[0].stop_id, '4258359')

		assert.ok(feed.stops.length > 0)
		assert.equal(feed.stops[0].stop_name, 'Northfield Depot')
	})

	it('returns [] for a file missing from the directory, as the fixture has no shapes.txt', () => {
		assert.equal(fs.existsSync(path.join(fixtureDir, 'shapes.txt')), false)

		let feed = readFeed(fixtureDir)

		assert.deepEqual(feed.shapes, [])
	})

	it('returns every key as [], the shape a wrong directory produces rather than a throw', () => {
		let emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gtfs-empty-'))

		let feed = readFeed(emptyDir)

		assert.deepEqual(feed, {
			feedInfo: [],
			agency: [],
			routes: [],
			trips: [],
			stopTimes: [],
			stops: [],
			shapes: [],
			calendar: [],
			calendarDates: [],
		})
	})
})
