import * as React from 'react'
import {Button, HStack, Image, Spacer, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityLabel,
	background,
	buttonStyle,
	clipShape,
	font,
	foregroundColor,
	frame,
	listRowSeparator,
	padding,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import type {EventType} from '@frogpond/event-type'
import {listTimeLines} from './times'

/// How far the accent bar clears the title/subtitle block at each end,
/// matching the event detail header's bar.
const BAR_OVERSHOOT = 3

type Props = {
	event: EventType
	onPress: (event: EventType) => void
	/// Whether this is the last row in its section -- hides that row's own
	/// bottom separator, since the section header below already draws a
	/// hairline of its own and Calendar.app's list has only one line between
	/// a section's last row and the next header, not two.
	isLastInSection: boolean
}

/// `config.startTime`/`config.endTime` mark a start or end that is not
/// meaningful for this event (e.g. imported data with only one real edge) --
/// the old left-column row hid the line rather than show a nonsense time, and
/// this trailing column does the same.
function TrailingTimes({event}: {event: EventType}): React.ReactNode {
	let {start, end, allDay} = listTimeLines(event)

	if (allDay) {
		return (
			<Text modifiers={[font({textStyle: 'body'}), foregroundColor(c.secondaryLabel)]}>
				all-day
			</Text>
		)
	}

	let showStart = event.config.startTime
	let showEnd = event.config.endTime && end

	return (
		<VStack alignment="trailing">
			{showStart ? (
				<Text modifiers={[font({textStyle: 'body'}), foregroundColor(c.label)]}>{start}</Text>
			) : null}
			{showEnd ? (
				<Text modifiers={[font({textStyle: 'body'}), foregroundColor(c.secondaryLabel)]}>
					{end}
				</Text>
			) : null}
		</VStack>
	)
}

/// A single event row: a blue accent bar, the title and (when present) a
/// location line under it, and the start/end times trailing. Matches
/// Calendar.app's list -- see the reference screenshot in the task brief --
/// rather than the old left-hand time column this replaces.
export function EventListRow({event, onPress, isLastInSection}: Props): React.ReactNode {
	let title = event.title
	let subtitle = event[event.config.subtitle]?.trim()

	return (
		<Button
			modifiers={[
				buttonStyle('plain'),
				accessibilityLabel(title),
				...(isLastInSection ? [listRowSeparator('hidden', 'bottom')] : []),
			]}
			onPress={() => onPress(event)}
		>
			{/* `top`, not the default `center`: a one-line title next to a two-line
			    trailing time column (start over end) would otherwise float to the
			    row's vertical centre instead of sitting level with the start time. */}
			<HStack alignment="top">
				{/* Same fixed-width-via-min/maxWidth trick as the detail header's bar --
				    `frame`'s native side ignores min/max once width or height is set. */}
				<VStack
					modifiers={[
						frame({minWidth: 4, maxWidth: 4, maxHeight: Infinity}),
						background(c.systemBlue),
						clipShape('capsule'),
					]}
				>
					{null}
				</VStack>

				<VStack alignment="leading" modifiers={[padding({vertical: BAR_OVERSHOOT})]}>
					<Text
						modifiers={[font({textStyle: 'body', weight: 'semibold'}), foregroundColor(c.label)]}
					>
						{title}
					</Text>
					{subtitle ? (
						<HStack spacing={4}>
							<Image color={c.secondaryLabel} size={12} systemName="mappin" />
							<Text modifiers={[font({textStyle: 'footnote'}), foregroundColor(c.secondaryLabel)]}>
								{subtitle}
							</Text>
						</HStack>
					) : null}
				</VStack>

				<Spacer />

				<TrailingTimes event={event} />
			</HStack>
		</Button>
	)
}
