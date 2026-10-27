import * as React from 'react'
import {AppState} from 'react-native'
import * as Notifications from 'expo-notifications'
import {hashKey} from '@tanstack/react-query'

import {queryClient} from '../../../../init/tanstack-query'
import {STATIONS} from '../stations'
import {useRadioStore} from '../store'
import {stationScheduleOptions} from '../use-station-schedule'
import {reminderStation, shouldPresentReminder} from './present'
import {syncShowReminders} from './sync'

/** Whether the query hashed `queryHash` is the schedule of a station with a followed show. */
function isFollowedSchedule(queryHash: string): boolean {
	let stationIds = new Set(useRadioStore.getState().followedShows.map((show) => show.stationId))
	return [...stationIds].some(
		(stationId) =>
			hashKey(stationScheduleOptions(STATIONS[stationId].schedule).queryKey) === queryHash,
	)
}

/** Opens the player on the station a tapped reminder names. */
function openReminder(response: Notifications.NotificationResponse | null): void {
	let stationId = reminderStation(response?.notification.request.content.data)
	if (stationId !== null) {
		useRadioStore.getState().openSheet(stationId)
	}
}

/**
 * Keeps radio show reminders in step with what is followed, the permission
 * given and the schedules, and opens the player from a tapped reminder.
 * Mounted once, beside the radio's host.
 */
export function ShowRemindersHost(): null {
	// Until the saved follows have loaded, a sync would read none and cancel
	// every reminder, and a tapped reminder's station would be overwritten.
	let hydrated = useRadioStore((state) => state.hydrated)
	React.useEffect(() => {
		if (!hydrated) {
			return
		}
		Notifications.setNotificationHandler({
			handleNotification: (notification) => {
				let shown = shouldPresentReminder(
					notification.request.content.data,
					useRadioStore.getState(),
				)
				return Promise.resolve({
					shouldShowBanner: shown,
					shouldShowList: shown,
					shouldPlaySound: shown,
					shouldSetBadge: false,
				})
			},
		})
		openReminder(Notifications.getLastNotificationResponse())
		let responses = Notifications.addNotificationResponseReceivedListener(openReminder)

		// The return from Settings is an app-active, which is how a permission
		// granted there reaches follows saved before it.
		void syncShowReminders()
		let appState = AppState.addEventListener('change', (status) => {
			if (status === 'active') void syncShowReminders()
		})
		let follows = useRadioStore.subscribe((state, previous) => {
			if (state.followedShows !== previous.followedShows) void syncShowReminders()
		})
		let schedules = queryClient.getQueryCache().subscribe((event) => {
			if (
				event.type === 'updated' &&
				event.action.type === 'success' &&
				isFollowedSchedule(event.query.queryHash)
			) {
				void syncShowReminders()
			}
		})

		return () => {
			Notifications.setNotificationHandler(null)
			responses.remove()
			appState.remove()
			follows()
			schedules()
		}
	}, [hydrated])
	return null
}
