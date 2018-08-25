// @flow

import {GoogleAnalyticsSettings} from 'react-native-google-analytics-bridge'
import {getAnalyticsOptOut} from '../lib/storage'

async function disableIfOptedOut() {
	let didOptOut = await getAnalyticsOptOut()

	if (didOptOut) {
		GoogleAnalyticsSettings.setOptOut(true)
	}
}

disableIfOptedOut()
