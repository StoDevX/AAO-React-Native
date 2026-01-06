import {clearAsyncStorage} from './storage'
import * as Updates from 'expo-updates'
import {resetCredentials} from './login'
import * as icons from '@hawkrives/react-native-alternate-icons'

export async function refreshApp(): Promise<void> {
	// Clear AsyncStorage
	await clearAsyncStorage()

	// Clear the Keychain items
	await resetCredentials()

	// Reset the app icon
	if ((await icons.getIconName()) !== 'default') {
		await icons.reset()
	}

	// Restart the app
	await Updates.reloadAsync()
}
