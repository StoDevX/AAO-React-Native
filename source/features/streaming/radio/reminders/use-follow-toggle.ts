import * as React from 'react'
import {Linking} from 'react-native'

import {showTitle, type ReminderSurface} from '../../../telemetry/catalog'
import {track} from '../../../telemetry/track'
import {isReminding, useRadioStore, type FollowedShow} from '../store'
import {reminderPermission, requestReminderPermission} from './notifications'
import {promptFor, type ReminderPrompt} from './prompt'
import {syncShowReminders} from './sync'

/**
 * Following and unfollowing shows from a bell. A bell unfollows only a show it
 * shows as reminding; otherwise it follows, and when reminders cannot arrive
 * it raises `prompt`, for the surface to show its permission sheet. The follow
 * is kept whatever the person picks there.
 */
export function useFollowToggle(surface: ReminderSurface): {
	toggle: (show: FollowedShow) => void
	prompt: ReminderPrompt | null
	confirmPrompt: () => void
	dismissPrompt: () => void
} {
	let [prompt, setPrompt] = React.useState<ReminderPrompt | null>(null)

	let toggle = React.useCallback(
		(show: FollowedShow) => {
			let state = useRadioStore.getState()
			let title = showTitle(show.title)
			if (isReminding(state, show)) {
				state.unfollow(show)
				track({
					name: 'radio.reminder.unfollow',
					anonymous: true,
					attributes: {station: show.stationId, title, surface},
				})
				return
			}
			state.follow(show)
			void reminderPermission().then((permission) => {
				useRadioStore.getState().setReminderPermission(permission)
				track({
					name: 'radio.reminder.follow',
					anonymous: true,
					attributes: {station: show.stationId, title, surface, permission},
				})
				setPrompt(promptFor(permission))
			})
		},
		[surface],
	)

	let confirmPrompt = React.useCallback(() => {
		setPrompt(null)
		if (prompt === 'settings') {
			track({name: 'radio.reminder.permission', attributes: {outcome: 'settings'}})
			void Linking.openSettings()
			return
		}
		void requestReminderPermission().then((permission) => {
			useRadioStore.getState().setReminderPermission(permission)
			let outcome = permission === 'granted' ? ('granted' as const) : ('denied' as const)
			track({name: 'radio.reminder.permission', attributes: {outcome}})
			return syncShowReminders()
		})
	}, [prompt])

	// The sheet reports closing after Continue too, by when the prompt is already gone.
	let dismissPrompt = React.useCallback(() => {
		if (prompt !== null) {
			track({name: 'radio.reminder.permission', attributes: {outcome: 'not_now'}})
		}
		setPrompt(null)
	}, [prompt])

	return {toggle, prompt, confirmPrompt, dismissPrompt}
}
