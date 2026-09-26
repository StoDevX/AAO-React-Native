import * as React from 'react'
import {Text, View} from 'react-native'

import type {
	PlaceCardAboutProps,
	PlaceCardHeaderProps,
	PlaceCardScaffoldProps,
} from '@frogpond/place-card-header'

/// The module reaches expo-modules-core's native view registry, which does
/// not exist under Jest, so the card's tests render this instead. It shows
/// the title and subtitle, and reports `animate` as the title's accessibility
/// value so a test can read which stop allowed motion.
///
/// Nothing here fades, scrolls or truncates, so a Jest test is never evidence
/// about any of that -- only about what the card asked for.
export function PlaceCardHeader({
	animate,
	hidden,
	subtitle,
	testID,
	title,
}: PlaceCardHeaderProps): React.ReactNode {
	// Hidden natively means no space, nothing drawn, nothing for VoiceOver.
	if (hidden) {
		return null
	}
	return (
		<View>
			<Text accessibilityValue={{text: animate ? 'animating' : 'still'}} testID={testID}>
				{title}
			</Text>
			{subtitle ? <Text>{subtitle}</Text> : null}
		</View>
	)
}

/// Header first, then the list, in document order -- which is all Jest can
/// check. The pinning and the frost are native and belong to a UI test.
export function PlaceCardScaffold({children}: PlaceCardScaffoldProps): React.ReactNode {
	return <View>{children}</View>
}

/// The whole text, always: the five-line clamp and MORE are native, so Jest
/// sees only what the card passed in.
export function PlaceCardAbout({testID, text}: PlaceCardAboutProps): React.ReactNode {
	return <Text testID={testID}>{text}</Text>
}
