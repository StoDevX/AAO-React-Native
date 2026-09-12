import * as Sentry from '@sentry/react-native'
import * as SQLite from 'expo-sqlite'

import {dropDatabase, getRunner} from '../client'

// `expo-sqlite` is a native module with nothing to bind to under Jest. What is
// under test here is neither SQLite nor the schema -- both have their own tests
// against real SQLite -- but the order `dropDatabase` does two things in, and
// what it does when the second one throws. Both are decided in JavaScript.
jest.mock('expo-sqlite', () => ({
	openDatabaseSync: jest.fn(),
	deleteDatabaseSync: jest.fn(),
}))
jest.mock('@sentry/react-native', () => ({captureException: jest.fn()}))

/** A stand-in for the handle `openDatabaseSync` returns, recording its calls. */
function fakeDatabase(calls: string[]) {
	return {
		execSync: jest.fn(),
		getAllSync: jest.fn(() => []),
		runSync: jest.fn(),
		withTransactionSync: jest.fn((task: () => void) => task()),
		closeSync: jest.fn(() => calls.push('close')),
	}
}

describe('dropDatabase', () => {
	let calls: string[]

	beforeEach(() => {
		jest.clearAllMocks()
		calls = []
		let database = fakeDatabase(calls)
		jest.mocked(SQLite.openDatabaseSync).mockReturnValue(database as never)
		jest.mocked(SQLite.deleteDatabaseSync).mockImplementation(() => {
			calls.push('delete')
		})
	})

	// `expo-sqlite` refuses to delete a database that is still open
	// (`DeleteDatabaseException`, "Close it prior to deletion"), so closing has
	// to happen before the delete, or the delete fails and throws.
	it('closes the database before deleting it', () => {
		getRunner()
		dropDatabase()
		expect(calls).toEqual(['close', 'delete'])
	})

	it('opens a fresh database afterwards rather than reusing the closed one', () => {
		getRunner()
		dropDatabase()
		getRunner()
		expect(SQLite.openDatabaseSync).toHaveBeenCalledTimes(2)
	})

	// The state of a device where the calendar screen was never opened: there
	// is no file, and `deleteDatabaseSync` treats that as an error. `refreshApp`
	// calls this with the keychain reset, the icon reset and the restart still
	// ahead of it, so a throw here would leave "Reset Everything" half-applied.
	it('does not throw when there is no database to delete', () => {
		jest.mocked(SQLite.deleteDatabaseSync).mockImplementation(() => {
			throw new Error('Database /tmp/aao.db not found')
		})
		expect(() => dropDatabase()).not.toThrow()
		expect(Sentry.captureException).not.toHaveBeenCalled()
	})

	it('reports a delete that failed for any other reason, and still does not throw', () => {
		jest.mocked(SQLite.deleteDatabaseSync).mockImplementation(() => {
			throw new Error('Unable to delete database /tmp/aao.db that is currently open')
		})
		expect(() => dropDatabase()).not.toThrow()
		expect(Sentry.captureException).toHaveBeenCalledTimes(1)
	})

	it('does not throw when nothing was ever opened to close', () => {
		expect(() => dropDatabase()).not.toThrow()
		expect(calls).toEqual(['delete'])
	})
})
