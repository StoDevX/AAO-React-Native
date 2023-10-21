import {resetInternetCredentials} from 'react-native-keychain'
import restart from 'react-native-restart'

import * as icons from '@hawkrives/react-native-alternate-icons'

import {SIS_LOGIN_KEY} from './login'
import {clearAsyncStorage} from './storage'

export async function refreshApp(): Promise<void> {
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
