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

import {useIsFollowing, type FollowedShow} from '../store'

/** What a bell says it will do: VoiceOver reads this in place of the glyph. */
export function bellLabel(show: FollowedShow, following: boolean): string {
	return following ? `Stop reminding me about ${show.title}` : `Remind me about ${show.title}`
}

/** A row's bell in a SwiftUI list: follows or unfollows `show`. */
export function FollowBell({
	show,
	onToggle,
}: {
	show: FollowedShow
	onToggle: (show: FollowedShow) => void
}): React.ReactNode {
	let following = useIsFollowing(show)
	return (
		<Button
			modifiers={[
				buttonStyle('plain'),
				accessibilityLabel(bellLabel(show, following)),
				accessibilityIdentifier(`radio-schedule-bell-${show.title}`),
			]}
			onPress={() => onToggle(show)}
		>
			<Image
				modifiers={[
					foregroundStyle(following ? c.systemBlue : c.secondaryLabel),
					frame({width: 44, height: 44}),
					contentShape(shapes.rectangle()),
				]}
				systemName={following ? 'bell.fill' : 'bell'}
			/>
		</Button>
	)
}

/** The show sheet's Remind Me button, which reads Reminding once followed. */
export function FollowButton({
	show,
	onToggle,
}: {
	show: FollowedShow
	onToggle: (show: FollowedShow) => void
}): React.ReactNode {
	let following = useIsFollowing(show)
	return (
		<Button
			modifiers={[
				buttonStyle('glass'),
				accessibilityLabel(bellLabel(show, following)),
				padding({horizontal: 20}),
			]}
			onPress={() => onToggle(show)}
		>
			<HStack spacing={6}>
				<Image systemName={following ? 'bell.fill' : 'bell'} />
				<Text>{following ? 'Reminding' : 'Remind Me'}</Text>
			</HStack>
		</Button>
	)
}
