// @flow
import {
	GoogleAnalyticsTracker,
	GoogleAnalyticsSettings,
} from 'react-native-google-analytics-bridge'
import {stringifyFilters} from './views/components/filter'

import {getAnalyticsOptOut} from './lib/storage'

const trackerId =
	process.env.NODE_ENV === 'development' ? 'UA-90234209-1' : 'UA-90234209-2'

export const tracker = new GoogleAnalyticsTracker(trackerId)

function disableIfOptedOut() {
	return getAnalyticsOptOut().then(didOptOut => {
		if (didOptOut) {
			GoogleAnalyticsSettings.setOptOut(true)
		}
	})
}
disableIfOptedOut()

// Google requires that custom dimensions be tracked by index, and we only get
// 20 custom dimensions, so I decided to centralize them here.
export function trackMenuFilters(menuName: string, filters: any) {
	tracker.trackEventWithCustomDimensionValues(
		'menus',
		'filter',
		{label: menuName},
		{'1': stringifyFilters(filters)},
	)
}

export function trackHomescreenOrder(order: string[], isDefaultOrder: boolean) {
	tracker.trackEventWithCustomDimensionValues(
		'homescreen',
		'reorder',
		{label: isDefaultOrder ? 'default-order' : 'custom-order'},
		{'2': order.join(', ')},
	)
}

export function trackHomescreenDisabledItem(viewName: string) {
	tracker.trackEventWithCustomDimensionValues(
		'homescreen',
		'disabled',
		{label: viewName, value: 1},
		{'3': viewName},
	)
}

export function trackHomescreenReenabledItem(viewName: string) {
	tracker.trackEventWithCustomDimensionValues(
		'homescreen',
		're-enabled',
		{label: viewName, value: -1},
		{'3': viewName},
	)
}

// These are centralized event functions, so we have an easy place to review
// them all. There is no limit to the number of these that we can have.
export const trackStreamPlay = (streamName: string) =>
	tracker.trackEvent('stream', 'play', {label: streamName})

export const trackStreamPause = (streamName: string) =>
	tracker.trackEvent('stream', 'pause', {label: streamName})

export const trackStreamError = (streamName: string) =>
	tracker.trackEvent('stream', 'error', {label: streamName})

export const trackBuildingView = (buildingName: string) =>
	tracker.trackEvent('building-hours', 'open', {label: buildingName})

export const trackDefinitionView = (word: string) =>
	tracker.trackEvent('dictionary', 'open', {label: word})

export const trackOrgOpen = (orgName: string) =>
	tracker.trackEvent('student-org', 'open', orgName)
