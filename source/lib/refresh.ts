import {clearAsyncStorage} from './storage'
import restart from 'react-native-restart'
import {clearLoginCredentials} from './login'
import * as icons from '@hawkrives/react-native-alternate-icons'

export async function refreshApp(): Promise<void> {
	// Clear AsyncStorage
	await clearAsyncStorage()

	// Clear the Keychain items
	await clearLoginCredentials()

	// Reset the app icon
	if ((await icons.getIconName()) !== 'default') {
		await icons.reset()
	}

	// Restart the app
	restart.Restart()
}
