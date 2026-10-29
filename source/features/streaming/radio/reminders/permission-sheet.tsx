import * as React from 'react'
import {StyleSheet} from 'react-native'
import {BottomSheet, Button, Group, Host, Image, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityIdentifier,
	buttonStyle,
	controlSize,
	font,
	foregroundStyle,
	multilineTextAlignment,
	padding,
	presentationDetents,
	presentationDragIndicator,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'

import type {ReminderPrompt} from './prompt'

/** What UI tests find the sheet by. */
export const PERMISSION_SHEET_ID = 'reminder-permission-sheet'

/** Each prompt's words: why notifications are wanted, and what the button will do. */
const COPY: Record<ReminderPrompt, {title: string; body: string; action: string}> = {
	ask: {
		title: 'Get Show Reminders',
		body: 'Get a notification a minute before each show you follow starts. You’ll be asked to allow notifications next.',
		action: 'Continue',
	},
	settings: {
		title: 'Notifications Are Off',
		body: 'To get show reminders, turn on notifications for this app in Settings.',
		action: 'Open Settings',
	},
}

type Props = {
	prompt: ReminderPrompt | null
	onConfirm: () => void
	onClose: () => void
}

/**
 * Asked after a follow while reminders cannot arrive, in the manner of a
 * What's New screen: what reminders are, and where the button goes next.
 * Each surface with a bell mounts its own, so it stacks over that surface's
 * sheet. This one goes inside a SwiftUI tree; `HostedReminderPermissionSheet`
 * goes in a React Native one.
 */
export function ReminderPermissionSheet({prompt, onConfirm, onClose}: Props): React.ReactNode {
	// Kept past its closing, so the words do not empty while the sheet slides away.
	let [shown, setShown] = React.useState<ReminderPrompt>('ask')
	if (prompt !== null && prompt !== shown) {
		setShown(prompt)
	}
	let copy = COPY[shown]

	return (
		<BottomSheet
			isPresented={prompt !== null}
			onIsPresentedChange={(presented) => {
				if (!presented) {
					onClose()
				}
			}}
		>
			<Group modifiers={[presentationDetents(['medium']), presentationDragIndicator('visible')]}>
				<VStack
					modifiers={[accessibilityIdentifier(PERMISSION_SHEET_ID), padding({all: 28})]}
					spacing={16}
				>
					<Image
						modifiers={[font({size: 56}), foregroundStyle(c.systemBlue)]}
						systemName="bell.badge"
					/>
					<Text modifiers={[font({textStyle: 'title', weight: 'bold'})]}>{copy.title}</Text>
					<Text
						modifiers={[
							font({textStyle: 'body'}),
							foregroundStyle(c.secondaryLabel),
							multilineTextAlignment('center'),
						]}
					>
						{copy.body}
					</Text>
					<Button
						label={copy.action}
						modifiers={[buttonStyle('glassProminent'), controlSize('large')]}
						onPress={onConfirm}
					/>
					<Button label="Not Now" modifiers={[buttonStyle('plain')]} onPress={onClose} />
				</VStack>
			</Group>
		</BottomSheet>
	)
}

/** `ReminderPermissionSheet`, for a React Native tree. */
export function HostedReminderPermissionSheet(props: Props): React.ReactNode {
	return (
		<Host pointerEvents="none" style={styles.host}>
			<ReminderPermissionSheet {...props} />
		</Host>
	)
}

const styles = StyleSheet.create({
	// Nothing to see or touch until the sheet is presented.
	host: {position: 'absolute', width: 0, height: 0},
})
