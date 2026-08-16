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
	lineLimit,
	listRowSeparator,
	padding,
	truncationMode,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import type {EventType} from '@frogpond/event-type'
import {listTimeLines} from './times'

/// How far the accent bar clears the title/subtitle block at each end,
/// matching the event detail header's bar.
const BAR_OVERSHOOT = 3

/// Calendar.app truncates a long title or location to one line with a
/// trailing ellipsis rather than wrapping -- wrapping pushes the row tall and,
/// with a long location, can push the title out of line with the start time.
const SINGLE_LINE = [lineLimit(1), truncationMode('tail')]

type Props = {
	event: EventType
	onPress: (event: EventType) => void
	/// Whether this is the last row in its section -- hides that row's own
	/// bottom separator, since the section header below already draws a
	/// hairline of its own and Calendar.app's list has only one line between
	/// a section's last row and the next header, not two.
	isLastInSection: boolean
}

/// The trailing text for each of the row's two lines.
///
/// `config.startTime`/`config.endTime` mark a start or end that is not
/// meaningful for this event (e.g. imported data with only one real edge) --
/// the old left-column row hid the line rather than show a nonsense time, and
/// these do the same, which also hands that line's width back to the title or
/// the location.
function trailingText(event: EventType): {first: string; second: string; firstIsTime: boolean} {
	let {start, end, allDay} = listTimeLines(event)

	if (allDay) {
		return {first: 'all-day', second: '', firstIsTime: false}
	}

	return {
		first: event.config.startTime ? start : '',
		second: event.config.endTime ? end : '',
		firstIsTime: true,
	}
}

/// One line of the row: leading text, then its own trailing text pushed to the
/// right edge.
///
/// Calendar.app pairs them line by line rather than setting two columns side by
/// side -- the title truncates against the start time, and the location against
/// the end time. So a row with no end time lets its location run the full width,
/// past where the title above it had to stop. Two columns would truncate both at
/// the same x, which is what this replaced.
function RowLine({
	trailing,
	prominent = false,
	children,
}: {
	trailing: string
	/// The start time reads in the primary label colour, as Calendar.app has it;
	/// the end time and `all-day` are secondary.
	prominent?: boolean
	children: React.ReactNode
}): React.ReactNode {
	return (
		<HStack spacing={8}>
			{children}
			<Spacer />
			{trailing ? (
				<Text
					modifiers={[
						font({textStyle: 'body'}),
						foregroundColor(prominent ? c.label : c.secondaryLabel),
						lineLimit(1),
					]}
				>
					{trailing}
				</Text>
			) : null}
		</HStack>
	)
}

/// A single event row: a blue accent bar, the title and (when present) a
/// location line under it, and the start/end times trailing. Matches
/// Calendar.app's list -- see the reference screenshot in the task brief --
/// rather than the old left-hand time column this replaces.
export function EventListRow({event, onPress, isLastInSection}: Props): React.ReactNode {
	let title = event.title
	let subtitle = event[event.config.subtitle]?.trim()
	let {first, second, firstIsTime} = trailingText(event)

	return (
		<Button
			modifiers={[
				buttonStyle('plain'),
				accessibilityLabel(title),
				...(isLastInSection ? [listRowSeparator('hidden', 'bottom')] : []),
			]}
			onPress={() => onPress(event)}
		>
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
					<RowLine prominent={firstIsTime} trailing={first}>
						<Text
							modifiers={[
								font({textStyle: 'body', weight: 'semibold'}),
								foregroundColor(c.label),
								...SINGLE_LINE,
							]}
						>
							{title}
						</Text>
					</RowLine>

					{subtitle || second ? (
						<RowLine trailing={second}>
							{subtitle ? (
								<HStack spacing={4}>
									<Image color={c.secondaryLabel} size={12} systemName="mappin" />
									<Text
										modifiers={[
											font({textStyle: 'footnote'}),
											foregroundColor(c.secondaryLabel),
											...SINGLE_LINE,
										]}
									>
										{subtitle}
									</Text>
								</HStack>
							) : null}
						</RowLine>
					) : null}
				</VStack>
			</HStack>
		</Button>
	)
}
