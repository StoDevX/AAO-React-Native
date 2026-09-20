import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {parseCsv} from './gtfs.mjs'

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
