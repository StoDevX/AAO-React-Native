import {clearAsyncStorage} from './storage'
import restart from 'react-native-restart'
import {SIS_LOGIN_KEY} from './login'
import * as icons from '@hawkrives/react-native-alternate-icons'
import {resetInternetCredentials} from 'react-native-keychain'

// Dev-only: clear home layout prefs to defaults
import AsyncStorage from '@react-native-async-storage/async-storage'

export async function resetHomeLayout(): Promise<void> {
	try {
		await AsyncStorage.multiRemove([
			'home_prefs_v1',
			'home_recent_views_v1',
		])
	} catch {}
}

export async function refreshApp(): Promise<void> {
	await resetHomeLayout()
	// Clear AsyncStorage
	await clearAsyncStorage()

	// Clear the Keychain items
	await resetInternetCredentials(SIS_LOGIN_KEY)

	// Reset the app icon
	if ((await icons.getIconName()) !== 'default') {
		await icons.reset()
	}

	// Restart the app
	restart.Restart()
}
