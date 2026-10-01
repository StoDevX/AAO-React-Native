import * as Sentry from '@sentry/react-native'
import * as SQLite from 'expo-sqlite'
import {isUITesting} from '@frogpond/launch-arguments'

import {UITEST_COURSES} from '../lib/course-search/__fixtures__/courses'
import {catalogFile, filePath} from './courses/catalog-file.ts'
import {CATALOG_SCHEMA, writeFixtureCatalog} from './courses/fixture.ts'
import {buildCourseIndex, openCatalog} from './courses/index-build.ts'
import {ensureSchema, SCHEMA_VERSION} from './schema.ts'
import type {SqlRunner, Statement} from './sql.ts'

const DATABASE_NAME = 'aao.db'

/**
 * expo-sqlite's default is to finalize every statement on the connection
 * before closing it, FTS5's own included; SQLite then finalizes those again
 * as it disconnects the FTS table, and the app crashes. Every statement here
 * is finalized by the call that made it, so there is nothing for that pass
 * to do.
 */
const OPEN_OPTIONS: SQLite.SQLiteOpenOptions = {finalizeUnusedStatementsBeforeClosing: false}

let runner: SqlRunner | undefined

/**
 * The open handle behind `runner`, kept because `dropDatabase` needs it:
 * `expo-sqlite` refuses to delete a database that is still open, and a
 * `SqlRunner` is four closures with no way back to the connection.
 */
let database: SQLite.SQLiteDatabase | undefined

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
		db = SQLite.openDatabaseSync(DATABASE_NAME, OPEN_OPTIONS)
	} catch {
		SQLite.deleteDatabaseSync(DATABASE_NAME)
		db = SQLite.openDatabaseSync(DATABASE_NAME, OPEN_OPTIONS)
	}

	db.execSync('pragma foreign_keys = on')
	let next = wrap(db)
	ensureSchema(next, fingerprint())
	attachCourseCatalog(next)
	database = db
	runner = next
	return next
}

/**
 * Puts the course catalog in reach of `runner`: under UI testing a fixture
 * written into memory, otherwise the downloaded file once there is one. A
 * file that will not open or has no index is a cache that cannot be read,
 * so it is deleted and the next refresh downloads it again.
 */
function attachCourseCatalog(runner: SqlRunner): void {
	if (isUITesting) {
		runner.exec(`attach database ':memory:' as ${CATALOG_SCHEMA}`)
		writeFixtureCatalog(runner, UITEST_COURSES)
		buildCourseIndex(runner, CATALOG_SCHEMA)
		return
	}
	let file = catalogFile()
	try {
		openCatalog(runner, file.exists ? filePath(file) : null)
	} catch (error) {
		Sentry.captureException(error)
		try {
			runner.exec(`detach database ${CATALOG_SCHEMA}`)
		} catch {
			// It was never attached, or openCatalog already detached it.
		}
		try {
			if (file.exists) file.delete()
		} catch (deleteError) {
			Sentry.captureException(deleteError)
		}
	}
}

/**
 * Whether a `deleteDatabaseSync` throw means there was nothing to delete.
 *
 * A device where the calendar screen was never opened has no database file,
 * and `expo-sqlite` raises `DatabaseNotFoundException` for that rather than
 * doing nothing. It shares its `E_SQLITE_DELETE_DATABASE` code with the two
 * failures worth knowing about -- the database was still open, or the file
 * could not be removed -- so the wording is all there is to tell them apart
 * (`Database <path> not found`, expo-sqlite 57.0.2's `ios/Exceptions.swift`).
 *
 * A message match is only safe because of what it decides: whether to report
 * the throw, never whether to rethrow it. If the wording ever changes, a
 * device with no database sends one harmless Sentry event -- it does not
 * break the reset.
 */
function isMissingDatabase(error: unknown): boolean {
	return error instanceof Error && error.message.includes('not found')
}

/**
 * Deletes the database outright. `refreshApp` calls this: it clears the query
 * cache, the persister and AsyncStorage, and would otherwise leave the
 * database behind as the only surviving copy of the data it just wiped.
 *
 * Closing first is a requirement, not tidiness -- `expo-sqlite` refuses to
 * delete an open database. And nothing here throws, because `refreshApp` has
 * the keychain, the app icon and the restart still to do: a reset that gave up
 * on a cache of refetchable data would leave the user with the half-reset app
 * they asked to have wiped.
 */
export function dropDatabase(): void {
	try {
		database?.closeSync()
	} catch (error) {
		Sentry.captureException(error)
	}

	runner = undefined
	database = undefined

	try {
		SQLite.deleteDatabaseSync(DATABASE_NAME)
	} catch (error) {
		if (!isMissingDatabase(error)) {
			Sentry.captureException(error)
		}
	}

	// A reset wipes every cache, and the course catalog is one.
	try {
		let file = catalogFile()
		if (file.exists) file.delete()
	} catch (error) {
		Sentry.captureException(error)
	}
}
