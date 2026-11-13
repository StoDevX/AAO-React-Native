import type {ReminderPermission} from './notifications'

/**
 * What the sheet after a follow offers: the system's own dialog, the way to
 * Settings, or, on Android once notifications are on, the way to its
 * "Alarms & reminders" page, so reminders arrive on the minute.
 */
export type ReminderPrompt = 'ask' | 'settings' | 'onTime'

/** The sheet a follow made under `permission` shows, or null when reminders can already arrive. */
export function promptFor(permission: ReminderPermission): ReminderPrompt | null {
	if (permission === 'granted') {
		return null
	}
	return permission === 'undetermined' ? 'ask' : 'settings'
}
