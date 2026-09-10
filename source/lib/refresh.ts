import {clearAsyncStorage} from './storage'
import {Restart} from 'react-native-restart-newarch'
import {SIS_LOGIN_KEY} from './login'
import {getIcon, resetIcon} from 'react-native-change-icon'
import {persister, queryClient} from '../init/tanstack-query'
import {resetInternetCredentials} from 'react-native-keychain'

export async function refreshApp(): Promise<void> {
	// Empty the query cache at the source, then delete what it already wrote.
	// Wiping storage alone leaves the cache in memory, and its writes are
	// throttled -- one scheduled before the wipe lands after it, restoring the
	// data we just cleared. An emptied cache has nothing left to write back.
	queryClient.clear()
	await persister.removeClient()

	// Clear AsyncStorage
	await clearAsyncStorage()

	// Clear the Keychain items
	await resetInternetCredentials({server: SIS_LOGIN_KEY})

	// Reset the app icon
	if ((await getIcon()) !== 'Default') {
		await resetIcon()
	}

	// Restart the app
	Restart()
}
