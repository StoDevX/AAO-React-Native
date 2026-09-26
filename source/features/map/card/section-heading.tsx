import * as React from 'react'
import {HStack, Spacer, Text} from '@expo/ui/swift-ui'

import {HEADING_ROW, HEADING_ROW_WITH_CONTROL, HEADING_TEXT} from './card-style'

/// A section's bold title, as the first row of its section, with an optional
/// control at its trailing end (Maps puts More and Edit there).
export function SectionHeading({
	title,
	trailing,
}: {
	title: string
	trailing?: React.ReactNode
}): React.ReactNode {
	if (!trailing) {
		return <Text modifiers={[...HEADING_TEXT, ...HEADING_ROW]}>{title}</Text>
	}
	return (
		<HStack modifiers={HEADING_ROW_WITH_CONTROL}>
			<Text modifiers={HEADING_TEXT}>{title}</Text>
			<Spacer />
			{trailing}
		</HStack>
	)
}
