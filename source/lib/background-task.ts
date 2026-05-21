import * as BackgroundFetch from 'expo-background-fetch'
import * as TaskManager from 'expo-task-manager'

import {useNotificationPreferences} from './notification-preferences'
import {BACKGROUND_NOTIFICATIONS_TASK} from './notifications'

// Minimum interval between background fetches in seconds (15 minutes).
// iOS treats this as advisory — the system decides the actual schedule.
const MINIMUM_FETCH_INTERVAL_SECONDS = 15 * 60

// Task definition must be at module scope (not inside a function or component)
// so expo-task-manager can register it before any React tree is mounted.
TaskManager.defineTask(BACKGROUND_NOTIFICATIONS_TASK, () => {
	try {
		const {enabled, enabledFeatures} = useNotificationPreferences.getState()

		if (!enabled) {
			return Promise.resolve(BackgroundFetch.BackgroundFetchResult.NoData)
		}

		const features = enabledFeatures()
		if (features.length === 0) {
			return Promise.resolve(BackgroundFetch.BackgroundFetchResult.NoData)
		}

		// Per-feature notification delivery logic will be wired here in a future task.
		return Promise.resolve(BackgroundFetch.BackgroundFetchResult.NewData)
	} catch {
		return Promise.resolve(BackgroundFetch.BackgroundFetchResult.Failed)
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
