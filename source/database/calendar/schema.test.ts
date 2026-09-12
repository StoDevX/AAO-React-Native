import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

import {ensureSchema} from '../schema.ts'
import type {SqlRunner} from '../sql.ts'
import {openTestDatabase} from '../testing/harness.ts'

function fresh(): SqlRunner {
	let runner = openTestDatabase()
	ensureSchema(runner, 'test')
	return runner
}

function addEvent(
	runner: SqlRunner,
	sourceId: string,
	eventKey: string,
	rank: number,
	dedupeKey: string,
): void {
	runner.run({
		sql: 'insert into event values (?,?,?,?,?,?,?)',
		params: [sourceId, eventKey, rank, dedupeKey, 'Soccer', 'Field', '{}'],
	})
}

describe('calendar schema', () => {
	it('cascades occurrences and tags when an event goes', () => {
		let runner = fresh()
		addEvent(runner, 'stolaf', 'k1', 0, 'dk')
		runner.run({
			sql: 'insert into occurrence values (?,?,?,?,?,?,?)',
			params: ['stolaf', 'k1', 0, 1_000, 2_000, null, null],
		})
		runner.run({
			sql: 'insert into event_tag values (?,?,?,?)',
			params: ['stolaf', 'k1', 'category', 'Sports'],
		})

		runner.run({
			sql: 'delete from event where source_id = ? and event_key = ?',
			params: ['stolaf', 'k1'],
		})

		let occurrences = runner.all<{n: number}>({
			sql: 'select count(*) n from occurrence',
			params: [],
		})
		let tags = runner.all<{n: number}>({sql: 'select count(*) n from event_tag', params: []})
		assert.equal(occurrences[0].n, 0)
		assert.equal(tags[0].n, 0)
	})
})
