import {DatabaseSync} from 'node:sqlite'

import type {SqlRunner, Statement} from '../sql.ts'

/**
 * An in-memory `SqlRunner` over `node:sqlite`, so the schema and every query
 * builder can be tested against real SQLite — real indexes, real query
 * planner — with no simulator and no mocks.
 *
 * Test-only. `node:sqlite` is invisible to Metro, so nothing in the app's
 * import graph may reach this file; `.oxlintrc.json` enforces that.
 */
export function openTestDatabase(): SqlRunner {
	let db = new DatabaseSync(':memory:')
	db.exec('pragma foreign_keys = on')

	return {
		exec: (sql) => db.exec(sql),
		// node:sqlite returns each row as an Object.create(null) instance, which
		// fails assert.deepEqual against a plain-object literal in tests. Spread
		// each row into a plain object so callers see ordinary objects, matching
		// what expo-sqlite's getAllSync already returns.
		all: <Row>(stmt: Statement) =>
			db
				.prepare(stmt.sql)
				.all(...stmt.params)
				.map((row) => ({...row})) as Row[],
		run: (stmt: Statement) => void db.prepare(stmt.sql).run(...stmt.params),
	}
}
