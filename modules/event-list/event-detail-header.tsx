import * as React from 'react'
import {HStack, Text, VStack} from '@expo/ui/swift-ui'
import {background, clipShape, font, foregroundColor, frame} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import type {EventTimeLine} from './times'

type Props = {
	title: string
	lines: EventTimeLine[]
}

/// One line of the date range, e.g. `From 7:45 AM Monday, August 17, 2026`.
/// The meridiem renders in its own smaller nested `Text`, matching
/// Calendar.app's small-caps AM/PM -- `@expo/ui`'s `Text` accepts nested
/// `Text` elements as children alongside plain strings.
function TimeLine({line}: {line: EventTimeLine}): React.ReactNode {
	return (
		<Text modifiers={[font({textStyle: 'body'}), foregroundColor(c.label)]}>
			{line.prefix ? `${line.prefix} ` : ''}
			{line.time ? `${line.time} ` : ''}
			{line.meridiem ? (
				<Text modifiers={[font({size: 11, weight: 'semibold'}), foregroundColor(c.label)]}>
					{`${line.meridiem} `}
				</Text>
			) : null}
			{line.date}
		</Text>
	)
}

/// The accent bar is a fixed tint rather than an event colour: `EventType`
/// carries none, and the list's own bar is a plain separator.
export function EventDetailHeader({title, lines}: Props): React.ReactNode {
	return (
		<HStack>
			{/* `frame`'s native implementation ignores min/max fields whenever `width` or
			`height` is also set (it switches to the exact-size overload), so the fixed
			width has to come from `minWidth`/`maxWidth` for `maxHeight` to take effect.
			`maxHeight: Infinity` is SwiftUI's usual "match the tallest HStack sibling"
			idiom -- there's no `frame` param for "sibling height plus a few points", so
			the bar tracks the title/date block's height exactly rather than overshooting
			it a few points on each end the way Calendar.app's does. */}
			<VStack
				modifiers={[
					frame({minWidth: 4, maxWidth: 4, maxHeight: Infinity}),
					background(c.systemBlue),
					clipShape('capsule'),
				]}
			>
				{null}
			</VStack>
			{/* Calendar.app sets the date in the same primary colour as the title
			    rather than a muted caption, so it reads as part of the masthead. */}
			<VStack alignment="leading">
				<Text modifiers={[font({textStyle: 'title', weight: 'bold'}), foregroundColor(c.label)]}>
					{title}
				</Text>
				{lines.length > 0 ? (
					<VStack alignment="leading" testID="event-detail-times">
						{lines.map((line, index) => (
							<TimeLine key={`${line.prefix}-${index}`} line={line} />
						))}
					</VStack>
				) : null}
			</VStack>
		</HStack>
	)
}
