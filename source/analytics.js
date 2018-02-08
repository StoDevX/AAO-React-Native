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

// Disable things
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
		{label: menuName, value: 1},
		{'1': stringifyFilters(filters)},
	)
}

export function trackHomescreenOrder(order: string[], isDefaultOrder: boolean) {
	tracker.trackEventWithCustomDimensionValues(
		'homescreen',
		'reorder',
		{label: isDefaultOrder ? 'default-order' : 'custom-order', value: 1},
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
	tracker.trackEvent('stream', 'play-stream', {label: streamName, value: 1})

export const trackStreamPause = (streamName: string) =>
	tracker.trackEvent('stream', 'pause-stream', {label: streamName, value: 1})

export const trackStreamError = (streamName: string) =>
	tracker.trackEvent('stream', 'errored-stream', {label: streamName, value: 1})

export const trackBuildingOpen = (buildingName: string) =>
	tracker.trackEvent('building-hours', 'open-building', {label: buildingName, value: 1})

export const trackDefinitionOpen = (word: string) =>
	tracker.trackEvent('dictionary', 'open-definition', {label: word, value: 1})

export const trackOrgOpen = (orgName: string) =>
	tracker.trackEvent('student-org', 'open-org', {label: orgName, value: 1})

export const trackCalendarEventOpen = (eventTitle: string) =>
	tracker.trackEvent('calendar-event', 'open-event', {label: eventTitle, value: 1})

export const trackStudentJobOpen = (jobTitle: string) =>
	tracker.trackEvent('student-jobs', 'open-posting', {label: jobTitle, value: 1})

export const trackLogIn = () => tracker.trackEvent('account', 'log-in')

export const trackLoginFailure = (reason: string) =>
	tracker.trackEvent('account', 'login-failure', {label: reason, value: 1})

export const trackLogOut = () => tracker.trackEvent('account', 'log-out')
