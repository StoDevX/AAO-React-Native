import * as React from 'react'

import {showTitle, type ReminderSurface} from '../../../telemetry/catalog'
import {track} from '../../../telemetry/track'
import {isReminding, useRadioStore, type FollowedShow} from '../store'
import {reminderPermission} from './notifications'
import {promptFor, type ReminderPrompt} from './prompt'
import {turnOnReminders} from './turn-on'

/**
 * Following and unfollowing shows from a bell. A bell unfollows only a show it
 * shows as reminding; otherwise it follows, and when reminders cannot arrive
 * it raises `prompt`, for the surface to show its permission sheet. Not Now,
 * or iOS refusing, takes the follow back, so no show is followed that its bell
 * does not show; one sent to Settings is kept, to remind once turned on there.
 */
export function useFollowToggle(surface: ReminderSurface): {
	toggle: (show: FollowedShow) => void
	prompt: ReminderPrompt | null
	confirmPrompt: () => void
	dismissPrompt: () => void
} {
	let [prompt, setPrompt] = React.useState<ReminderPrompt | null>(null)
	// The show whose follow raised the prompt, taken back if the prompt is declined.
	let asking = React.useRef<FollowedShow | null>(null)

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
				asking.current = show
				setPrompt(promptFor(permission))
			})
		},
		[surface],
	)

	let confirmPrompt = React.useCallback(() => {
		setPrompt(null)
		if (prompt === null) {
			return
		}
		let show = asking.current
		void turnOnReminders(prompt).then((permission) => {
			if (permission !== null && permission !== 'granted' && show !== null) {
				useRadioStore.getState().unfollow(show)
			}
		})
	}, [prompt])

	// The sheet reports closing after Continue too, by when the prompt is already gone.
	let dismissPrompt = React.useCallback(() => {
		if (prompt !== null) {
			track({name: 'radio.reminder.permission', attributes: {outcome: 'not_now'}})
			if (asking.current !== null) {
				useRadioStore.getState().unfollow(asking.current)
			}
		}
		setPrompt(null)
	}, [prompt])

	return {toggle, prompt, confirmPrompt, dismissPrompt}
}
