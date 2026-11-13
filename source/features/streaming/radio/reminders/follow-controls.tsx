import * as React from 'react'
import {Button, HStack, Image, Text} from '@expo/ui/swift-ui'
import {
	accessibilityIdentifier,
	accessibilityLabel,
	buttonStyle,
	contentShape,
	foregroundStyle,
	frame,
	padding,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'

import {useIsReminding, type FollowedShow} from '../store'

/** What a bell says it will do: VoiceOver reads this in place of the glyph. */
export function bellLabel(show: FollowedShow, reminding: boolean): string {
	return reminding ? `Stop reminding me about ${show.title}` : `Remind me about ${show.title}`
}

/**
 * A bell in a SwiftUI list row, filled and tinted only while reminders will
 * arrive. The glyph sits at the trailing edge of its 44pt target, hard by the
 * row's edge rather than floating in the middle of the box.
 */
export function BellGlyph({filled}: {filled: boolean}): React.ReactNode {
	return (
		<Image
			modifiers={[
				foregroundStyle(filled ? c.systemBlue : c.secondaryLabel),
				frame({width: 44, height: 44, alignment: 'trailing'}),
				contentShape(shapes.rectangle()),
			]}
			systemName={filled ? 'bell.fill' : 'bell'}
		/>
	)
}

/** A full schedule row's bell: follows or unfollows `show`. */
export function FollowBell({
	show,
	onToggle,
}: {
	show: FollowedShow
	onToggle: (show: FollowedShow) => void
}): React.ReactNode {
	let reminding = useIsReminding(show)
	return (
		<Button
			modifiers={[
				buttonStyle('plain'),
				accessibilityLabel(bellLabel(show, reminding)),
				accessibilityIdentifier(`radio-full-schedule-bell-${show.title}`),
			]}
			onPress={() => onToggle(show)}
		>
			<BellGlyph filled={reminding} />
		</Button>
	)
}

/** The show sheet's Remind Me button, which reads Reminder On once reminders will arrive. */
export function FollowButton({
	show,
	onToggle,
}: {
	show: FollowedShow
	onToggle: (show: FollowedShow) => void
}): React.ReactNode {
	let reminding = useIsReminding(show)
	return (
		<Button
			modifiers={[
				buttonStyle('glass'),
				accessibilityLabel(bellLabel(show, reminding)),
				padding({horizontal: 20}),
			]}
			onPress={() => onToggle(show)}
		>
			<HStack spacing={6}>
				<Image
					modifiers={reminding ? [foregroundStyle(c.systemBlue)] : []}
					systemName={reminding ? 'bell.fill' : 'bell'}
				/>
				<Text>{reminding ? 'Reminder On' : 'Remind Me'}</Text>
			</HStack>
		</Button>
	)
}
