// @flow
import {AsyncStorage} from 'react-native'
import {
  GoogleAnalyticsTracker,
  GoogleAnalyticsSettings,
} from 'react-native-google-analytics-bridge'

const trackerId = __DEV__ ? 'UA-90234209-1' : 'UA-90234209-2'
export const tracker = new GoogleAnalyticsTracker(trackerId)

async function disableIfOptedOut() {
  const didOptOut = JSON.parse(await AsyncStorage.getItem('optout'))
  if (didOptOut) {
    GoogleAnalyticsSettings.setOptOut(true)
  }
}
disableIfOptedOut()
