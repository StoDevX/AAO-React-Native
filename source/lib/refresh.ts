import {clearStoredData} from './clear-stored-data'
import {Restart} from 'react-native-restart-newarch'
import {SIS_LOGIN_KEY} from './login'
import {getIcon, resetIcon} from 'react-native-change-icon'
import {resetInternetCredentials} from 'react-native-keychain'

export async function refreshApp(): Promise<void> {
	await clearStoredData()

	// Clear the Keychain items
	await resetInternetCredentials({server: SIS_LOGIN_KEY})

	// Reset the app icon
	if ((await getIcon()) !== 'Default') {
		await resetIcon()
	}

	// Restart the app
	Restart()
}
