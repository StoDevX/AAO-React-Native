import * as React from 'react'
import {HStack, Text, VStack} from '@expo/ui/swift-ui'
import {background, font, foregroundColor, frame} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'

type Props = {
	title: string
	times: string
}

/// The accent bar is a fixed tint rather than an event colour: `EventType`
/// carries none, and the list's own bar is a plain separator.
export function EventDetailHeader({title, times}: Props): React.ReactNode {
	return (
		<HStack modifiers={[frame({height: undefined})]}>
			{/* `frame`'s native implementation ignores min/max fields whenever `width` or
			`height` is also set (it switches to the exact-size overload), so the fixed
			width has to come from `minWidth`/`maxWidth` for `minHeight` to take effect. */}
			<VStack
				modifiers={[frame({minWidth: 4, maxWidth: 4, minHeight: 44}), background(c.systemBlue)]}
			>
				{null}
			</VStack>
			<VStack alignment="leading">
				<Text modifiers={[font({size: 22, weight: 'bold'}), foregroundColor(c.label)]}>
					{title}
				</Text>
				{times ? (
					<Text
						modifiers={[font({size: 15}), foregroundColor(c.secondaryLabel)]}
						testID="event-detail-times"
					>
						{times}
					</Text>
				) : null}
			</VStack>
		</HStack>
	)
}
