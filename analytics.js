// @flow
import {AsyncStorage} from 'react-native'
import {
  GoogleAnalyticsTracker,
  GoogleAnalyticsSettings,
} from 'react-native-google-analytics-bridge'
import {stringifyFilters} from './views/components/filter'

const trackerId = __DEV__ ? 'UA-90234209-1' : 'UA-90234209-2'
export const tracker = new GoogleAnalyticsTracker(trackerId)

async function disableIfOptedOut() {
  const didOptOut = JSON.parse(await AsyncStorage.getItem('optout'))
  if (didOptOut) {
    GoogleAnalyticsSettings.setOptOut(true)
  }
}
disableIfOptedOut()

// Google requires that custom dimensions be tracked by index, and we only get
// 20 custom dimensions, so I decided to centralize them here.
export function trackMenuFilters(menuName: string, filters: any) {
  tracker.trackEventWithCustomDimensionValues('menus', 'filter', {label: menuName}, {'1': stringifyFilters(filters)})
}

export function trackHomescreenOrder(order: string[]) {
  tracker.trackEventWithCustomDimensionValues('homescreen', 'reorder', {}, {'2': order.join(', ')})
}
