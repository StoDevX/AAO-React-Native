import type {ReminderPermission} from './notifications'

/** What the sheet after a follow offers: iOS's own dialog, or the way to Settings. */
export type ReminderPrompt = 'ask' | 'settings'

/** The sheet a follow made under `permission` shows, or null when reminders can already arrive. */
export function promptFor(permission: ReminderPermission): ReminderPrompt | null {
	if (permission === 'granted') {
		return null
	}
	return permission === 'undetermined' ? 'ask' : 'settings'
}
