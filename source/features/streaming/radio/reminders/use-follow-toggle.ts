import * as React from 'react'
import {Linking} from 'react-native'

import {track} from '../../../telemetry/track'
import {useRadioStore, type FollowedShow} from '../store'
import {reminderPermission, requestReminderPermission} from './notifications'
import {promptFor, type ReminderPrompt} from './prompt'
import {syncShowReminders} from './sync'

/**
 * Following and unfollowing shows from a bell. A follow made while reminders
 * cannot arrive raises `prompt`, for the surface to show its permission sheet;
 * the follow is kept whatever the person picks there.
 */
export function useFollowToggle(): {
	toggle: (show: FollowedShow) => void
	prompt: ReminderPrompt | null
	confirmPrompt: () => void
	dismissPrompt: () => void
} {
	let [prompt, setPrompt] = React.useState<ReminderPrompt | null>(null)

	let toggle = React.useCallback((show: FollowedShow) => {
		let {followedShows, follow, unfollow} = useRadioStore.getState()
		let following = followedShows.some(
			(each) => each.stationId === show.stationId && each.title === show.title,
		)
		if (following) {
			unfollow(show)
			track({name: 'radio.reminder.unfollow', attributes: {station: show.stationId}})
			return
		}
		follow(show)
		track({name: 'radio.reminder.follow', attributes: {station: show.stationId}})
		void reminderPermission().then((permission) => setPrompt(promptFor(permission)))
	}, [])

	let confirmPrompt = React.useCallback(() => {
		setPrompt(null)
		if (prompt === 'settings') {
			track({name: 'radio.reminder.permission', attributes: {outcome: 'settings'}})
			void Linking.openSettings()
			return
		}
		void requestReminderPermission().then((permission) => {
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
