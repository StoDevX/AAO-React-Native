import {clearAsyncStorage} from './storage'
import restart from 'react-native-restart'
import {SIS_LOGIN_KEY} from './login'
import {getIcon, resetIcon} from 'react-native-change-icon'
import {resetInternetCredentials} from 'react-native-keychain'

export async function refreshApp(): Promise<void> {
	// Clear AsyncStorage
	await clearAsyncStorage()

	// Clear the Keychain items
	await resetInternetCredentials(SIS_LOGIN_KEY)

	// Reset the app icon
	if ((await getIcon()) !== 'Default') {
		await resetIcon()
	}

	// Restart the app
	restart.Restart()
}
