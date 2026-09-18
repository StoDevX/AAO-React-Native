import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

import {ensureSchema, SCHEMA_VERSION} from './schema.ts'
import {openTestDatabase} from './testing/harness.ts'

describe('ensureSchema', () => {
	it('creates the schema on a fresh database', () => {
		let runner = openTestDatabase()
		let reset = ensureSchema(runner, 'fp-1')
		assert.equal(reset, true, 'a fresh database counts as a reset')
		let rows = runner.all<{value: string}>({
			sql: 'select value from meta where key = ?',
			params: ['fingerprint'],
		})
		assert.deepEqual(rows, [{value: 'fp-1'}])
	})

	it('leaves a matching database alone', () => {
		let runner = openTestDatabase()
		ensureSchema(runner, 'fp-1')
		runner.run({
			sql: 'insert into event values (?,?,?,?,?,?,?)',
			params: ['stolaf', 'k1', 0, 'dk', 'Recital', 'Chapel', '{}'],
		})
		let reset = ensureSchema(runner, 'fp-1')
		assert.equal(reset, false)
		let rows = runner.all<{n: number}>({sql: 'select count(*) n from event', params: []})
		assert.equal(rows[0].n, 1, 'rows survive a matching fingerprint')
	})

	it('drops everything when the fingerprint differs', () => {
		let runner = openTestDatabase()
		ensureSchema(runner, 'fp-1')
		runner.run({
			sql: 'insert into event values (?,?,?,?,?,?,?)',
			params: ['stolaf', 'k1', 0, 'dk', 'Recital', 'Chapel', '{}'],
		})
		let reset = ensureSchema(runner, 'fp-2')
		assert.equal(reset, true)
		let rows = runner.all<{n: number}>({sql: 'select count(*) n from event', params: []})
		assert.equal(rows[0].n, 0, 'a changed fingerprint wipes the cache')
	})

	it('exports a positive integer version', () => {
		assert.ok(Number.isInteger(SCHEMA_VERSION) && SCHEMA_VERSION > 0)
	})
})
