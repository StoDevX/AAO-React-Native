import * as React from 'react'
import {
	Button,
	Circle,
	HStack,
	Image,
	Rectangle,
	Spacer,
	Text,
	VStack,
	ZStack,
} from '@expo/ui/swift-ui'
import {
	accessibilityElement,
	accessibilityLabel,
	buttonStyle,
	contentShape,
	font,
	foregroundStyle,
	frame,
	listRowInsets,
	listRowSeparator,
	opacity,
	padding,
	shadow,
	shapes,
	type ViewModifier,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {FILL_WIDTH} from '../../../../components/tile-layout'
import type {BusStopStatusEnum} from '../lib'

/** Width of the column the rail runs down; the rail and dots sit at its centre. */
const RAIL_COLUMN_WIDTH = 40
const RAIL_WIDTH = 5
const BUS_ICON_SIZE = 18
/** A stop the bus has passed: a small solid disc. */
const PASSED_DOT_SIZE = 12
/** A stop still ahead: a ring, so it reads as a hole punched in the rail. */
const UPCOMING_DOT_SIZE = 18
/** The stop the bus is at: a larger ring in the line's highlight colour. */
const CURRENT_DOT_SIZE = 20
const RING_WIDTH = 3
const TEXT_VERTICAL_PADDING = 10

/**
 * Zeroed top and bottom insets so one row's rail meets the next, and no
 * separator, which would cut across the rail.
 */
const ROW_MODIFIERS = [
	listRowInsets({top: 0, bottom: 0, leading: 0, trailing: 16}),
	listRowSeparator('hidden'),
]

type Props = {
	title: string
	detail?: string
	stopStatus: BusStopStatusEnum
	barColor: string
	currentStopColor: string
	isFirstRow: boolean
	isLastRow: boolean
	/** How far the bus is along the leg into this row, when it is on that leg. */
	busProgress?: number
	/** Whether the bus is sitting on this row's dot. */
	busAtStop?: boolean
	/** What the row announces; it begins with the title, which the UI tests match on. */
	accessibilityLabel: string
	onPress?: () => void
}

/**
 * The bus itself, drawn on a rail. Shared by the timetable's vertical rail and
 * the widget's horizontal strip so the two agree on its size and tint.
 */
export function BusGlyph({
	color,
	modifiers,
}: {
	color: string
	/** Applied after the glyph's own, so a caller can move it along its rail. */
	modifiers?: ViewModifier[]
}): React.ReactNode {
	// A zero frame keeps the glyph out of layout: it draws centred on the
	// point it is given without making the rail segment it rides any taller.
	return (
		<Image
			modifiers={[
				font({size: BUS_ICON_SIZE}),
				foregroundStyle(color),
				shadow({radius: 2, y: 1}),
				frame({width: 0, height: 0}),
				...(modifiers ?? []),
			]}
			systemName="bus.fill"
		/>
	)
}

function StopDot({
	stopStatus,
	barColor,
	currentStopColor,
}: {
	stopStatus: BusStopStatusEnum
	barColor: string
	currentStopColor: string
}): React.ReactNode {
	if (stopStatus === 'skip') {
		return null
	}

	if (stopStatus === 'after') {
		return (
			<Circle
				modifiers={[
					frame({width: PASSED_DOT_SIZE, height: PASSED_DOT_SIZE}),
					foregroundStyle(barColor),
				]}
			/>
		)
	}

	let size = stopStatus === 'at' ? CURRENT_DOT_SIZE : UPCOMING_DOT_SIZE
	let ringColor = stopStatus === 'at' ? currentStopColor : barColor
	let holeSize = size - 2 * RING_WIDTH

	// The hole is the card's own background so the rail behind does not show
	// through; a systemFill is translucent by design and would let it.
	return (
		<ZStack>
			<Circle modifiers={[frame({width: size, height: size}), foregroundStyle(ringColor)]} />
			<Circle
				modifiers={[
					frame({width: holeSize, height: holeSize}),
					foregroundStyle(c.secondarySystemGroupedBackground),
				]}
			/>
		</ZStack>
	)
}

function RailSegment({
	barColor,
	isHidden,
	children,
}: {
	barColor: string
	isHidden: boolean
	children?: React.ReactNode
}): React.ReactNode {
	return (
		<ZStack modifiers={[frame({maxHeight: Infinity})]}>
			<Rectangle
				modifiers={[
					frame({width: RAIL_WIDTH, maxHeight: Infinity}),
					foregroundStyle(barColor),
					opacity(isHidden ? 0 : 1),
				]}
			/>
			{children}
		</ZStack>
	)
}

function RowContent(props: Props): React.ReactNode {
	let {
		title,
		detail,
		stopStatus,
		barColor,
		currentStopColor,
		isFirstRow,
		isLastRow,
		busProgress,
		busAtStop,
		accessibilityLabel: label,
		onPress,
	} = props

	let titleColor =
		stopStatus === 'skip' ? c.tertiaryLabel : stopStatus === 'after' ? c.secondaryLabel : c.label
	let detailColor = stopStatus === 'skip' ? c.tertiaryLabel : c.secondaryLabel

	// A bus on the leg into this row rides the upper segment. Its exact
	// position along the segment is not drawn: a row's height is set by its
	// text, and finding it would mean measuring the row and feeding the result
	// back into it. The glyph sits at the segment's midpoint instead.
	let busOnSegment = busProgress != null && !busAtStop

	return (
		<HStack
			modifiers={[
				contentShape(shapes.rectangle()),
				frame({maxWidth: FILL_WIDTH}),
				...(onPress ? [] : [accessibilityElement('combine'), accessibilityLabel(label)]),
			]}
			spacing={12}
		>
			{/* The rail is two segments either side of the dot, so the ends
			    can go transparent on the first and last rows and the rail
			    terminates at their dots. `Rectangle` rather than `Capsule`:
			    rounded ends pinch where one row's segment meets the next. */}
			<ZStack modifiers={[frame({width: RAIL_COLUMN_WIDTH, maxHeight: Infinity})]}>
				<VStack spacing={0}>
					<RailSegment barColor={barColor} isHidden={isFirstRow}>
						{busOnSegment ? <BusGlyph color={currentStopColor} /> : null}
					</RailSegment>
					<RailSegment barColor={barColor} isHidden={isLastRow} />
				</VStack>
				{busAtStop ? (
					<BusGlyph color={currentStopColor} />
				) : (
					<StopDot
						barColor={barColor}
						currentStopColor={currentStopColor}
						stopStatus={stopStatus}
					/>
				)}
			</ZStack>

			<VStack
				alignment="leading"
				modifiers={[padding({vertical: TEXT_VERTICAL_PADDING})]}
				spacing={2}
			>
				<Text
					modifiers={[
						font({textStyle: 'body', weight: stopStatus === 'at' ? 'semibold' : 'regular'}),
						foregroundStyle(titleColor),
					]}
				>
					{title}
				</Text>
				{detail ? (
					<Text modifiers={[font({textStyle: 'subheadline'}), foregroundStyle(detailColor)]}>
						{detail}
					</Text>
				) : null}
			</VStack>

			<Spacer />

			{onPress ? (
				<Image
					modifiers={[
						font({textStyle: 'footnote', weight: 'semibold'}),
						foregroundStyle(c.tertiaryLabel),
					]}
					systemName="chevron.right"
				/>
			) : null}
		</HStack>
	)
}

/**
 * One row of a bus timetable: a stop or a departure, beside the rail that
 * runs the length of the list. Pressable when given `onPress`, in which case
 * the whole row is the target.
 */
export function TimetableRow(props: Props): React.ReactNode {
	let {onPress, accessibilityLabel: label} = props

	if (!onPress) {
		return (
			<HStack modifiers={ROW_MODIFIERS}>
				<RowContent {...props} />
			</HStack>
		)
	}

	return (
		<Button
			modifiers={[...ROW_MODIFIERS, buttonStyle('plain'), accessibilityLabel(label)]}
			onPress={onPress}
		>
			<RowContent {...props} />
		</Button>
	)
}
