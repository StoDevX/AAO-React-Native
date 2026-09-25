import * as React from 'react'
import {Text, View} from 'react-native'

import type {PlaceCardHeaderProps, PlaceCardScaffoldProps} from '@frogpond/place-card-header'

/// The module reaches expo-modules-core's native view registry, which does
/// not exist under Jest, so the card's tests render this instead. It shows
/// the title and subtitle, and reports `animate` as the title's accessibility
/// value so a test can read which stop allowed motion.
///
/// Nothing here fades, scrolls or truncates, so a Jest test is never evidence
/// about any of that -- only about what the card asked for.
export function PlaceCardHeader({
	animate,
	subtitle,
	testID,
	title,
}: PlaceCardHeaderProps): React.ReactNode {
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
