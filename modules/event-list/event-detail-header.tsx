import * as React from 'react'
import {HStack, Text, VStack} from '@expo/ui/swift-ui'
import {
	background,
	clipShape,
	font,
	foregroundColor,
	frame,
	padding,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import type {EventTimeLine} from './times'

/// How far the accent bar clears the type at each end, as Calendar.app's does.
const BAR_OVERSHOOT = 3

type Props = {
	lines: EventTimeLine[]
}

/// One line of the date range, e.g. `From 7:45 AM Monday, August 17, 2026`.
///
/// The meridiem sets in plain caps at the line's own size. Calendar.app uses
/// small caps, but `@expo/ui`'s `font` exposes no `smallCaps`, and faking it
/// with a smaller nested `Text` reads as undersized rather than as small caps.
function TimeLine({line}: {line: EventTimeLine}): React.ReactNode {
	let text = [line.prefix, line.time, line.meridiem, line.date].filter(Boolean).join(' ')

	return <Text modifiers={[font({textStyle: 'body'}), foregroundColor(c.label)]}>{text}</Text>
}

/// The date range, flanked by an accent bar. The event's name is not here: it
/// is the screen's native large title, so UIKit can collapse it into the bar on
/// scroll and manage the bar's appearance for both states.
///
/// The bar is a fixed tint rather than an event colour: `EventType` carries
/// none, and the list's own bar is a plain separator.
export function EventDetailHeader({lines}: Props): React.ReactNode {
	if (lines.length === 0) {
		return null
	}

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
			    rather than a muted caption, so it reads as part of the masthead.
			    The vertical padding is what makes the bar overshoot the text: it
			    grows the `HStack`, and the bar matches the stack rather than the
			    text, so the two ends clear the type by `BAR_OVERSHOOT` points. */}
			<VStack
				alignment="leading"
				modifiers={[padding({vertical: BAR_OVERSHOOT})]}
				testID="event-detail-times"
			>
				{lines.map((line, index) => (
					<TimeLine key={`${line.prefix}-${index}`} line={line} />
				))}
			</VStack>
		</HStack>
	)
}
