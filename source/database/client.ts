import * as SQLite from 'expo-sqlite'

import {ensureSchema, SCHEMA_VERSION} from './schema.ts'
import type {SqlRunner, Statement} from './sql.ts'

const DATABASE_NAME = 'aao.db'

let runner: SqlRunner | undefined

function fingerprint(): string {
	return `${SCHEMA_VERSION}|${Intl.DateTimeFormat().resolvedOptions().timeZone}`
}

function wrap(db: SQLite.SQLiteDatabase): SqlRunner {
	return {
		exec: (sql) => db.execSync(sql),
		all: <Row>(stmt: Statement) => db.getAllSync<Row>(stmt.sql, stmt.params),
		run: (stmt: Statement) => void db.runSync(stmt.sql, stmt.params),
		// Commits if `task` returns, rolls back if it throws.
		transaction: (task) => db.withTransactionSync(task),
	}
}

/**
 * The app's database, opened once.
 *
 * A database that will not open is a cache that cannot be read, so the
 * recovery is to delete it and start over rather than to surface an error the
 * user cannot act on. Everything in it is refetchable.
 */
export function getRunner(): SqlRunner {
	if (runner) return runner

	let db: SQLite.SQLiteDatabase
	try {
		db = SQLite.openDatabaseSync(DATABASE_NAME)
	} catch {
		SQLite.deleteDatabaseSync(DATABASE_NAME)
		db = SQLite.openDatabaseSync(DATABASE_NAME)
	}

	db.execSync('pragma foreign_keys = on')
	let next = wrap(db)
	ensureSchema(next, fingerprint())
	runner = next
	return next
}

/**
 * Deletes the database outright. `refreshApp` calls this: it clears the query
 * cache, the persister and AsyncStorage, and would otherwise leave the
 * database behind as the only surviving copy of the data it just wiped.
 */
export function dropDatabase(): void {
	runner = undefined
	SQLite.deleteDatabaseSync(DATABASE_NAME)
}
