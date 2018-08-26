// @flow
import {GoogleAnalyticsTracker, GoogleAnalyticsSettings} from 'react-native-google-analytics-bridge'
import {setItem, getItemAsBoolean} from '@frogpond/storage'

let tracker: GoogleAnalyticsTracker

// stuff to see if the app has opted-out of analytics
const analyticsOptOutKey = 'settings:opt-out'
export function setAnalyticsOptOut(status: boolean) {
	return setItem(analyticsOptOutKey, status)
}
export function getAnalyticsOptOut(): Promise<boolean> {
	return getItemAsBoolean(analyticsOptOutKey)
}

async function disableIfOptedOut() {
	let didOptOut = await getAnalyticsOptOut()

	if (didOptOut) {
		GoogleAnalyticsSettings.setOptOut(true)
	}
}

export function initTracker(id: string) {
	tracker = new GoogleAnalyticsTracker(id)
	disableIfOptedOut()
}

// Miscellaneous helper functions
export const trackUrl = (url: string) => tracker.trackScreenView(url)
export const trackScreenView = (id: string) => tracker.trackScreenView(id)
export const trackException = (ex: string) => tracker.trackException(ex)

export const trackEventWithCustomDimensionValues: typeof tracker.trackEventWithCustomDimensionValues = (...args) => tracker.trackEventWithCustomDimensionValues(...args)

// These are centralized event functions, so we have an easy place to review
// them all. There is no limit to the number of these that we can have.

// Eventually these will move into their respective modules, instead of living in here.
export const trackStreamPlay = (streamName: string) =>
	tracker.trackEvent('stream', 'play-stream', {label: streamName, value: 1})

export const trackStreamPause = (streamName: string) =>
	tracker.trackEvent('stream', 'pause-stream', {label: streamName, value: 1})

export const trackStreamError = (streamName: string) =>
	tracker.trackEvent('stream', 'errored-stream', {label: streamName, value: 1})

export const trackBuildingOpen = (buildingName: string) =>
	tracker.trackEvent('building-hours', 'open-building', {
		label: buildingName,
		value: 1,
	})

export const trackDefinitionOpen = (word: string) =>
	tracker.trackEvent('dictionary', 'open-definition', {label: word, value: 1})

export const trackOrgOpen = (orgName: string) =>
	tracker.trackEvent('student-org', 'open-org', {label: orgName, value: 1})

export const trackCalendarEventOpen = (eventTitle: string) =>
	tracker.trackEvent('calendar-event', 'open-event', {
		label: eventTitle,
		value: 1,
	})

export const trackStudentJobOpen = (jobTitle: string) =>
	tracker.trackEvent('student-jobs', 'open-posting', {
		label: jobTitle,
		value: 1,
	})

export const trackLogIn = () => tracker.trackEvent('account', 'log-in')

export const trackLoginFailure = (reason: string) =>
	tracker.trackEvent('account', 'login-failure', {label: reason, value: 1})

export const trackLogOut = () => tracker.trackEvent('account', 'log-out')
