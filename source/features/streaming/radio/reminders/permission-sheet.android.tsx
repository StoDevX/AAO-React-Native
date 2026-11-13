import * as React from 'react'
import {Alert} from 'react-native'

import type {ReminderPrompt} from './prompt'

export const PERMISSION_SHEET_ID = 'reminder-permission-sheet'

/**
 * What the prompt says, as Android words it: sentence case, and the
 * system's own names -- Android asks to "allow notifications" in a dialog of
 * its own, and turns them back on in the app's notification settings.
 */
const COPY: Record<ReminderPrompt, {title: string; body: string; action: string}> = {
	ask: {
		title: 'Get show reminders?',
		body: 'Get a notification a minute before each show you follow starts. Android will ask you to allow notifications next.',
		action: 'Continue',
	},
	settings: {
		title: 'Notifications are off',
		body: 'To get show reminders, turn on notifications for this app in Settings.',
		action: 'Open settings',
	},
}

type Props = {
	prompt: ReminderPrompt | null
	onConfirm: () => void
	onClose: () => void
}

/**
 * Asks before the system does, on Android as a Material dialog -- Android's
 * own rationale pattern, a dialog over the screen -- rather than a bottom
 * sheet over the full-screen player. Shown once each time `prompt` turns
 * non-null; Not now, Back or a tap outside closes it.
 */
export function ReminderPermissionSheet({prompt, onConfirm, onClose}: Props): React.ReactNode {
	let latest = React.useRef({onConfirm, onClose})
	React.useEffect(() => {
		latest.current = {onConfirm, onClose}
	})
	React.useEffect(() => {
		if (prompt === null) {
			return
		}
		let copy = COPY[prompt]
		Alert.alert(
			copy.title,
			copy.body,
			[
				{text: 'Not now', style: 'cancel', onPress: () => latest.current.onClose()},
				{text: copy.action, onPress: () => latest.current.onConfirm()},
			],
			{cancelable: true, onDismiss: () => latest.current.onClose()},
		)
	}, [prompt])
	return null
}

/** The same dialog; Android draws it in a window of its own, so it needs no host. */
export function HostedReminderPermissionSheet(props: Props): React.ReactNode {
	return <ReminderPermissionSheet {...props} />
}
