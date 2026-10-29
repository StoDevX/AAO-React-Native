import {Linking} from 'react-native'

import type {ReminderSurface} from '../../../telemetry/catalog'
import {track} from '../../../telemetry/track'
import {useRadioStore} from '../store'
import {requestReminderPermission, type ReminderPermission} from './notifications'
import type {ReminderPrompt} from './prompt'
import {syncShowReminders} from './sync'

/**
 * Turns reminders on as `prompt` offers: opens Settings once iOS will no
 * longer ask, or else shows iOS's dialog, keeps what the person chose, and
 * brings the reminders in line with it. Resolves with that choice, or null
 * when sent to Settings, whose answer arrives with the return to the app.
 */
export async function turnOnReminders(
	prompt: ReminderPrompt,
	surface: ReminderSurface,
): Promise<ReminderPermission | null> {
	if (prompt === 'settings') {
		track({name: 'radio.reminder.permission', attributes: {outcome: 'settings', surface}})
		void Linking.openSettings()
		return null
	}
	let permission = await requestReminderPermission()
	useRadioStore.getState().setReminderPermission(permission)
	let outcome = permission === 'granted' ? ('granted' as const) : ('denied' as const)
	track({name: 'radio.reminder.permission', attributes: {outcome, surface}})
	await syncShowReminders()
	return permission
}
