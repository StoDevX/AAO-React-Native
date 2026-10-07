import {clearAsyncStorage} from './storage'
import {persister, queryClient} from '../init/tanstack-query'
import {dropDatabase} from '../database/client'
import {persistor} from '../redux'

/**
 * Deletes what the app keeps between launches: the query cache, AsyncStorage
 * and the database. Used by `refreshApp` and by the UI tests' reset between
 * tests, each of which restarts the JavaScript afterwards.
 */
export async function clearStoredData(): Promise<void> {
	// Redux-persist writes a change on a later tick, so a setting changed just
	// before this would land after the wipe and survive it. Write what is
	// pending now, then stop writing.
	await persistor.flush()
	persistor.pause()

	// Empty the query cache at the source, then delete what it already wrote.
	// Wiping storage alone leaves the cache in memory, and its writes are
	// throttled -- one scheduled before the wipe lands after it, restoring the
	// data we just cleared. An emptied cache has nothing left to write back.
	queryClient.clear()
	await persister.removeClient()

	// Clear AsyncStorage
	await clearAsyncStorage()

	// Drop the calendar database. It would otherwise survive as the only
	// remaining copy of data the rest of this function just wiped.
	dropDatabase()
}
