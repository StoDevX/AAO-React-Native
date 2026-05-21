import * as BackgroundFetch from 'expo-background-fetch'
import * as TaskManager from 'expo-task-manager'

import {client} from '@frogpond/api'

import {useNotificationPreferences} from './notification-preferences'
import {
	BACKGROUND_NOTIFICATIONS_TASK,
	hasContentChanged,
	scheduleLocalNotification,
	setStoredHash,
} from './notifications'

// Minimum interval between background fetches in seconds (15 minutes).
// iOS treats this as advisory — the system decides the actual schedule.
const MINIMUM_FETCH_INTERVAL_SECONDS = 15 * 60

// ─── Per-feature fetch handlers ───────────────────────────────────────────────

/**
 * Fetches today's CCC menu and sends a notification if the content changed.
 * Returns true if a notification was delivered.
 */
export async function checkMenusNotification(): Promise<boolean> {
	const response = await client.get('food/named/menu/ccc').json()
	const {changed, newHash} = await hasContentChanged('menus', response)
	if (!changed) {
		return false
	}
	await scheduleLocalNotification({
		title: "Today's Menu Updated",
		body: "Check out what's for lunch at the CCC.",
		identifier: 'menus',
	})
	await setStoredHash('menus', newHash)
	return true
}

/**
 * Fetches the St. Olaf calendar and sends a notification if the content changed.
 * Returns true if a notification was delivered.
 */
export async function checkCalendarNotification(): Promise<boolean> {
	const response = await client.get('calendar/named/stolaf').json()
	const {changed, newHash} = await hasContentChanged('calendar', response)
	if (!changed) {
		return false
	}
	await scheduleLocalNotification({
		title: 'Calendar Updated',
		body: 'New events have been added to the St. Olaf calendar.',
		identifier: 'calendar',
	})
	await setStoredHash('calendar', newHash)
	return true
}

/**
 * Fetches the St. Olaf news feed and sends a notification if the content changed.
 * Returns true if a notification was delivered.
 */
export async function checkNewsNotification(): Promise<boolean> {
	const response = await client.get('news/named/stolaf').json()
	const {changed, newHash} = await hasContentChanged('news', response)
	if (!changed) {
		return false
	}
	await scheduleLocalNotification({
		title: 'News Updated',
		body: 'New stories have been posted on the St. Olaf news feed.',
		identifier: 'news',
	})
	await setStoredHash('news', newHash)
	return true
}

// Maps a feature ID string to its corresponding fetch handler.
function dispatchFeature(featureId: string): Promise<boolean> {
	switch (featureId) {
		case 'menus':
			return checkMenusNotification()
		case 'calendar':
			return checkCalendarNotification()
		case 'news':
			return checkNewsNotification()
		default:
			return Promise.resolve(false)
	}
}

// ─── Background task definition ───────────────────────────────────────────────

// Task definition must be at module scope (not inside a function or component)
// so expo-task-manager can register it before any React tree is mounted.
TaskManager.defineTask(BACKGROUND_NOTIFICATIONS_TASK, async () => {
	try {
		const {enabled, enabledFeatures} = useNotificationPreferences.getState()

		if (!enabled) {
			return BackgroundFetch.BackgroundFetchResult.NoData
		}

		const features = enabledFeatures()
		if (features.length === 0) {
			return BackgroundFetch.BackgroundFetchResult.NoData
		}

		const results = await Promise.allSettled(
			features.map((featureId) => dispatchFeature(featureId)),
		)
		const hadNewData = results.some(
			(r) => r.status === 'fulfilled' && r.value === true,
		)
		return hadNewData
			? BackgroundFetch.BackgroundFetchResult.NewData
			: BackgroundFetch.BackgroundFetchResult.NoData
	} catch {
		return BackgroundFetch.BackgroundFetchResult.Failed
	}
})

/**
 * Registers the background notifications task with the system.
 * Safe to call more than once — no-ops if already registered.
 */
export async function registerBackgroundTaskAsync(): Promise<void> {
	const isRegistered = await TaskManager.isTaskRegisteredAsync(
		BACKGROUND_NOTIFICATIONS_TASK,
	)
	if (isRegistered) {
		return
	}
	await BackgroundFetch.registerTaskAsync(BACKGROUND_NOTIFICATIONS_TASK, {
		minimumInterval: MINIMUM_FETCH_INTERVAL_SECONDS,
	})
}

/**
 * Unregisters the background notifications task.
 * Safe to call when not registered — no-ops in that case.
 */
export async function unregisterBackgroundTaskAsync(): Promise<void> {
	const isRegistered = await TaskManager.isTaskRegisteredAsync(
		BACKGROUND_NOTIFICATIONS_TASK,
	)
	if (!isRegistered) {
		return
	}
	await BackgroundFetch.unregisterTaskAsync(BACKGROUND_NOTIFICATIONS_TASK)
}
