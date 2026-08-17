import * as React from 'react'
import type {ColorValue} from 'react-native'
import {Button, HStack, Label, Spacer, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityLabel,
	background,
	buttonStyle,
	clipShape,
	contentShape,
	font,
	foregroundStyle,
	frame,
	labelStyle,
	lineLimit,
	listRowSeparator,
	padding,
	shapes,
	truncationMode,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import type {EventType} from '@frogpond/event-type'
import {listTimeLines} from './times'

/**
 * How far the accent bar clears the title/subtitle block at each end,
 * matching the event detail header's bar.
 */
const BAR_OVERSHOOT = 3

/**
 * The gap between the accent bar and the text beside it.
 *
 * Stated rather than left to the HStack's default, because the default is
 * derived from the contents and so is not the same on every row. A row with an
 * end time but no location draws a second line whose leading content is
 * nothing, so that line begins with the `Spacer` -- and a leading `Spacer`
 * takes the whole stack's default spacing to zero. Measured on the simulator,
 * bar to the first pixel of the title was 40px on rows with a location and
 * 15px on a row with an end time and no location; 8pt is what the default
 * resolves to on the rows that do get it.
 */
const BAR_GAP = 8

/**
 * Calendar.app truncates a long title or location to one line with a
 * trailing ellipsis rather than wrapping -- wrapping pushes the row tall and,
 * with a long location, can push the title out of line with the start time.
 */
const SINGLE_LINE = [lineLimit(1), truncationMode('tail')]

type Props = {
	event: EventType
	onPress: (event: EventType) => void
	/**
	 * Whether this is the last row in its section -- hides that row's own
	 * bottom separator, since the section header below already draws a
	 * hairline of its own and Calendar.app's list has only one line between
	 * a section's last row and the next header, not two.
	 */
	isLastInSection: boolean
	/**
	 * The accent bar's colour -- the calendar this event came from.
	 */
	color: ColorValue
}

/**
 * The trailing text for each of the row's two lines.
 *
 * `config.startTime`/`config.endTime` mark a start or end that is not
 * meaningful for this event (e.g. imported data with only one real edge). Such
 * a line is left empty rather than showing a nonsense time, which also hands
 * that line's width back to the title or the location.
 */
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

/**
 * One line of the row: leading text, then its own trailing text pushed to the
 * right edge.
 *
 * Calendar.app pairs them line by line rather than setting two columns side by
 * side -- the title truncates against the start time, and the location against
 * the end time. So a row with no end time lets its location run the full width,
 * past where the title above it had to stop. Two columns would truncate both at
 * the same x.
 */
function RowLine({
	trailing,
	prominent = false,
	children,
}: {
	trailing: string
	/**
	 * The start time reads in the primary label colour, as Calendar.app has it;
	 * the end time and `all-day` are secondary.
	 */
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
						foregroundStyle(prominent ? c.label : c.secondaryLabel),
						lineLimit(1),
					]}
				>
					{trailing}
				</Text>
			) : null}
		</HStack>
	)
}

/**
 * A single event row: an accent bar in the calendar's colour, the title and
 * (when present) a location line under it, and the start/end times trailing,
 * as Calendar.app's list has them.
 */
export function EventListRow({event, onPress, isLastInSection, color}: Props): React.ReactNode {
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
			{/* Without `contentShape`, SwiftUI hit-tests only the drawn parts of the
			    label -- the `Spacer` and the empty run to the right of a short title
			    are dead. A row whose title stops early, an all-day event with no
			    trailing time, is then only tappable on the words themselves. */}
			<HStack alignment="top" modifiers={[contentShape(shapes.rectangle())]} spacing={BAR_GAP}>
				{/* Same fixed-width-via-min/maxWidth trick as the detail header's bar --
				    `frame`'s native side ignores min/max once width or height is set. */}
				<VStack
					modifiers={[
						frame({minWidth: 4, maxWidth: 4, maxHeight: Infinity}),
						background(color),
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
								foregroundStyle(c.label),
								...SINGLE_LINE,
							]}
						>
							{title}
						</Text>
					</RowLine>

					{subtitle || second ? (
						<RowLine trailing={second}>
							{subtitle ? (
								/* A `Label` rather than an `HStack` of `Image` and `Text`: SwiftUI sizes the
								   glyph from the label's own font and sits it on the text's baseline, which
								   is what `Image`'s `size` prop cannot do. `@expo/ui` documents `size` as
								   not scaling with Dynamic Type and as ignored once a `font` modifier is
								   supplied, so a fixed 12pt pin was both oversized against `subheadline`
								   and off its baseline.

								   `subheadline` is measured, not chosen: Calendar.app's location line has a
								   32px cap height on a 3x screen against our 28px, which is 15pt to our
								   13pt. */
								<Label
									modifiers={[
										labelStyle('titleAndIcon'),
										font({textStyle: 'subheadline'}),
										foregroundStyle(c.secondaryLabel),
										...SINGLE_LINE,
									]}
									systemImage="location.circle"
									title={subtitle}
								/>
							) : null}
						</RowLine>
					) : null}
				</VStack>
			</HStack>
		</Button>
	)
}
