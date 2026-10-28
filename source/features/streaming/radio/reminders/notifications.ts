import * as Notifications from 'expo-notifications'

import {parseReminderIdentifier, type PendingReminder, type ReminderRequest} from './plan'
import {LISTEN_ACTION} from './present'

/** The category every reminder is scheduled in, which gives it the Listen button. */
const REMINDER_CATEGORY = 'radio-reminder'

/** Gives reminders their Listen button, which brings the app forward to play. */
export async function registerReminderActions(): Promise<void> {
	await Notifications.setNotificationCategoryAsync(REMINDER_CATEGORY, [
		{identifier: LISTEN_ACTION, buttonTitle: 'Listen', options: {opensAppToForeground: true}},
	])
}

/** Whether reminders can reach the person, and if not, whether iOS has asked them yet. */
export type ReminderPermission = 'granted' | 'undetermined' | 'denied'

function fromIos(status: Notifications.NotificationPermissionsStatus): ReminderPermission {
	switch (status.ios?.status) {
		case Notifications.IosAuthorizationStatus.NOT_DETERMINED:
			return 'undetermined'
		case Notifications.IosAuthorizationStatus.DENIED:
			return 'denied'
		case undefined:
			return status.granted ? 'granted' : status.canAskAgain ? 'undetermined' : 'denied'
		default:
			// Authorized, provisional and ephemeral all deliver.
			return 'granted'
	}
}

/** Where notification permission stands now. */
export async function reminderPermission(): Promise<ReminderPermission> {
	return fromIos(await Notifications.getPermissionsAsync())
}

/** Shows iOS's permission dialog, for alerts and sounds only, and says what the person chose. */
export async function requestReminderPermission(): Promise<ReminderPermission> {
	return fromIos(
		await Notifications.requestPermissionsAsync({ios: {allowAlert: true, allowSound: true}}),
	)
}

/** The radio reminders already scheduled; other notifications are left out. */
export async function pendingReminders(): Promise<PendingReminder[]> {
	let scheduled = await Notifications.getAllScheduledNotificationsAsync()
	return scheduled.flatMap((request) => parseReminderIdentifier(request.identifier) ?? [])
}

/** Cancels and schedules reminders as `planReminderChanges` decided. */
export async function applyReminderChanges(changes: {
	schedule: readonly ReminderRequest[]
	cancel: readonly string[]
}): Promise<void> {
	await Promise.all(
		changes.cancel.map((identifier) => Notifications.cancelScheduledNotificationAsync(identifier)),
	)
	await Promise.all(
		changes.schedule.map((request) =>
			Notifications.scheduleNotificationAsync({
				identifier: request.identifier,
				content: {
					title: request.stationName,
					body: request.body,
					data: {stationId: request.stationId, title: request.title},
					categoryIdentifier: REMINDER_CATEGORY,
				},
				trigger: {type: Notifications.SchedulableTriggerInputTypes.WEEKLY, ...request.slot},
			}),
		),
	)
}
