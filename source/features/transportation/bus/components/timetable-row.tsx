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
	accessibilityIdentifier,
	accessibilityLabel,
	buttonStyle,
	contentShape,
	font,
	foregroundStyle,
	frame,
	lineLimit,
	listRowInsets,
	alignmentGuide,
	offset,
	onGeometryChange,
	opacity,
	padding,
	shapes,
	truncationMode,
	type ViewModifier,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {FILL_WIDTH} from '../../../../components/tile-layout'
import type {BusStopStatusEnum} from '../lib'

/** Width of the column the rail runs down; the rail and dots sit at its centre. */
const RAIL_COLUMN_WIDTH = 40
/// Gap between the rail column and the stop's text.
const ROW_SPACING = 12
const RAIL_WIDTH = 5
/// Names the bus's own dot, for the tests that check where it is.
export const BUS_ON_RAIL = 'bus-on-rail'
/// The bus on the rail. Smaller than a passed stop's dot, so the two read apart.
const BUS_DOT_SIZE = 9
/** A stop the bus has passed: a small solid disc. */
const PASSED_DOT_SIZE = 12
/** A stop still ahead: a ring, so it reads as a hole punched in the rail. */
const UPCOMING_DOT_SIZE = 18
/** The stop the bus is at: a larger ring in the line's highlight colour. */
const CURRENT_DOT_SIZE = 20
const RING_WIDTH = 3
const TEXT_VERTICAL_PADDING = 10

/**
 * Zeroed top and bottom insets so one row's rail meets the next. The separator
 * starts where the text does, clearing the rail column: drawn full width it
 * would cut straight through the rail and the bus riding it.
 */
const ROW_MODIFIERS = [
	listRowInsets({top: 0, bottom: 0, leading: 0, trailing: 16}),
	alignmentGuide('listRowSeparatorLeading', RAIL_COLUMN_WIDTH + ROW_SPACING),
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
	busFraction?: number
	/** Whether the bus is sitting on this row's dot. */
	busAtStop?: boolean
	/**
	 * The height every row stands at, once one has been measured. Every row
	 * is one title line over one detail line, so one measurement holds for
	 * all of them, and it is what places a bus in transit along the rail.
	 */
	rowHeight?: number | null
	/** Reports this row's height; given to the one row that does the measuring. */
	onHeight?: (height: number) => void
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
	// A zero frame keeps the glyph out of layout: it draws centred on the point
	// it is given without making the rail segment it rides any taller. Both the
	// disc and the bus carry it, so the pair sits on that point together.
	let placement = [frame({width: 0, height: 0}), ...(modifiers ?? [])]

	return (
		<>
			{/* A bead on the rail rather than a bus. `bus.fill` is not a solid
			    shape -- its windscreen, headlights and the gap between its
			    wheels are holes the rail shows straight through -- and every
			    way of backing it added more than it was worth. A dot says the
			    same thing: the rail carries stops, and this is the thing moving
			    between them.

			    Smaller than a passed stop's dot and in the darker of the line's
			    two colours, so it reads as the bus and not as another stop. */}
			<Circle
				modifiers={[
					frame({width: BUS_DOT_SIZE, height: BUS_DOT_SIZE}),
					foregroundStyle(color),
					accessibilityIdentifier(BUS_ON_RAIL),
					...placement,
				]}
			/>
		</>
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

function RailSegment({barColor, isHidden}: {barColor: string; isHidden: boolean}): React.ReactNode {
	return (
		<Rectangle
			modifiers={[
				frame({width: RAIL_WIDTH, maxHeight: Infinity}),
				foregroundStyle(barColor),
				opacity(isHidden ? 0 : 1),
			]}
		/>
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
		busFraction,
		busAtStop,
		rowHeight,
		onHeight,
		accessibilityLabel: label,
		onPress,
	} = props

	let titleColor =
		stopStatus === 'skip' ? c.tertiaryLabel : stopStatus === 'after' ? c.secondaryLabel : c.label
	let detailColor = stopStatus === 'skip' ? c.tertiaryLabel : c.secondaryLabel

	// `busFraction` is where the bus sits relative to this row's own dot, in
	// rows, and never exceeds half a row -- so the glyph stays inside the row
	// drawing it, which a `List` row would otherwise clip. The same arithmetic
	// as the widget's strip, one axis over: there the cell width is a constant,
	// here the row height is measured once, since the text size sets it. Until
	// that measurement lands the bus is not drawn, so it never jumps.
	let busOffset =
		busFraction == null || busAtStop || rowHeight == null ? null : rowHeight * busFraction

	// The glyph has a zero frame, so nothing measured here depends on where
	// it is drawn: the height is the text's, and moving the bus cannot change it.
	let railColumnModifiers = [
		frame({width: RAIL_COLUMN_WIDTH, maxHeight: Infinity}),
		...(onHeight ? [onGeometryChange(({height}) => onHeight(height))] : []),
	]

	return (
		<HStack
			modifiers={[
				contentShape(shapes.rectangle()),
				frame({maxWidth: FILL_WIDTH}),
				...(onPress ? [] : [accessibilityElement('combine'), accessibilityLabel(label)]),
			]}
			spacing={ROW_SPACING}
		>
			{/* The rail is two segments either side of the dot, so the ends
			    can go transparent on the first and last rows and the rail
			    terminates at their dots. `Rectangle` rather than `Capsule`:
			    rounded ends pinch where one row's segment meets the next. */}
			<ZStack modifiers={railColumnModifiers}>
				<VStack spacing={0}>
					<RailSegment barColor={barColor} isHidden={isFirstRow} />
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
				{busOffset === null ? null : (
					<BusGlyph color={currentStopColor} modifiers={[offset({y: busOffset})]} />
				)}
			</ZStack>

			{/* One line each, so every row stands the same height and one
			    measurement places the bus on any of them. */}
			<VStack
				alignment="leading"
				modifiers={[padding({vertical: TEXT_VERTICAL_PADDING})]}
				spacing={2}
			>
				<Text
					modifiers={[
						font({textStyle: 'body', weight: stopStatus === 'at' ? 'semibold' : 'regular'}),
						foregroundStyle(titleColor),
						lineLimit(1),
						truncationMode('tail'),
					]}
				>
					{title}
				</Text>
				{detail ? (
					<Text
						modifiers={[
							font({textStyle: 'subheadline'}),
							foregroundStyle(detailColor),
							lineLimit(1),
							truncationMode('tail'),
						]}
					>
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
/**
 * Stands in for the stops the bus has already left, which the timetable folds
 * away so it opens on where the bus actually is. The rail runs through it at
 * the width it has everywhere else, so the route reads as continuous rather
 * than as starting here; the stops it covers are a tap away.
 */
export function CollapsedStopsRow({
	barColor,
	count,
	onPress,
}: {
	barColor: string
	count: number
	onPress: () => void
}): React.ReactNode {
	let label = count === 1 ? '1 previous stop' : `${count} previous stops`

	return (
		<Button
			modifiers={[buttonStyle('plain'), accessibilityLabel(`Show ${label}`), ...ROW_MODIFIERS]}
			onPress={onPress}
		>
			<HStack
				modifiers={[contentShape(shapes.rectangle()), frame({maxWidth: FILL_WIDTH})]}
				spacing={ROW_SPACING}
			>
				<ZStack modifiers={[frame({width: RAIL_COLUMN_WIDTH, maxHeight: Infinity})]}>
					<Rectangle
						modifiers={[
							frame({width: RAIL_WIDTH, maxHeight: Infinity}),
							foregroundStyle(barColor),
							opacity(0.35),
						]}
					/>
				</ZStack>

				<Text
					modifiers={[
						font({textStyle: 'subheadline'}),
						foregroundStyle(c.secondaryLabel),
						padding({vertical: TEXT_VERTICAL_PADDING}),
						frame({maxWidth: FILL_WIDTH, alignment: 'leading'}),
					]}
				>
					{label}
				</Text>
			</HStack>
		</Button>
	)
}

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
