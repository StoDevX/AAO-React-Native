// @flow
import {clearAsyncStorage} from './storage'
import restart from 'react-native-restart'
import {clearLoginCredentials} from './login'
import * as icons from '@hawkrives/react-native-alternate-icons'

export async function refreshApp() {
	// This purposefully does not reset the OneSignal subscription tags,
	// because OneSignals' deleteTags method requires a list of tags. This
	// would require that we call getTags before deleting them, which
	// introduces a network request into this procedure. I would rather avoid
	// network requests in here, _especially_ network requests which have
	// shown themselves to not always return in a timely fashion.

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
