import * as React from 'react'
import {
	Button,
	Circle,
	HStack,
	Image,
	LazyHStack,
	Rectangle,
	ScrollView,
	Section,
	Spacer,
	Text,
	useNativeState,
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
	id,
	listRowInsets,
	listRowSeparator,
	offset,
	opacity,
	scrollPosition,
	useScrollGeometryChange,
	scrollTargetLayout,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import type {ScrollGeometry} from '@expo/ui/swift-ui'
import type {Moment} from 'moment-timezone'

import * as c from '@frogpond/colors'
import {FILL_WIDTH} from '../../../components/tile-layout'
import {formatDeparture} from './components/times'
import {BusGlyph} from './components/timetable-row'
import {
	buildStopStrip,
	busPropsForRow,
	deriveLineState,
	findBusTarget,
	stripAnchorIndex,
	type StopStripCell,
} from './lib'
import type {UnprocessedBusLine} from './types'

/// Wide enough for "Buntrock Commons" to wrap to two lines rather than
/// truncate, narrow enough that four cells are visible at once on a 393pt
/// screen.
const CELL_WIDTH = 86
/// Height of the rail the dots sit on.
const RAIL_HEIGHT = 3
/// What the rail, and anything sitting on it, weighs ahead of the bus.
const RAIL_AHEAD_OPACITY = 0.35
/// Diameter of a stop's dot.
const DOT_SIZE = 11
/// A stop the bus has yet to reach is a ring rather than a disc, drawn at the
/// same width as the disc so the two sit on the rail as the same size of thing.
const FUTURE_RING_WIDTH = 2
const FUTURE_HOLE_SIZE = DOT_SIZE - 2 * FUTURE_RING_WIDTH

type Props = {
	line: UnprocessedBusLine
	now: Moment
	/** Opens the line's full timetable, from anywhere in the widget. */
	onPress: () => void
}

/**
 * A stop on the strip. One the bus has passed is a solid disc; one still ahead
 * is a ring at the rail's own weight with an opaque centre, so a reader can see
 * at a glance how much of the route is behind the bus and how much is to come.
 */
function StopDot({
	barColor,
	dotColor,
	isHere,
	isPassed,
	isSkipped,
}: {
	barColor: string
	dotColor: string
	isHere: boolean
	isPassed: boolean
	isSkipped: boolean
}): React.ReactNode {
	if (isHere) {
		return (
			<Circle modifiers={[frame({width: DOT_SIZE, height: DOT_SIZE}), foregroundStyle(dotColor)]} />
		)
	}

	if (isPassed || isSkipped) {
		return (
			<Circle
				modifiers={[
					frame({width: DOT_SIZE, height: DOT_SIZE}),
					foregroundStyle(barColor),
					opacity(isSkipped ? 0.25 : 1),
				]}
			/>
		)
	}

	// The centre is the card's own colour rather than clear: the rail runs
	// behind the dot and would otherwise show through the hole.
	return (
		<ZStack>
			<Circle modifiers={[frame({width: DOT_SIZE, height: DOT_SIZE}), foregroundStyle(barColor)]} />
			<Circle
				modifiers={[
					frame({width: FUTURE_HOLE_SIZE, height: FUTURE_HOLE_SIZE}),
					foregroundStyle(c.secondarySystemGroupedBackground),
				]}
			/>
		</ZStack>
	)
}

function StopCell({
	cell,
	index,
	barColor,
	dotColor,
	isFirst,
	isLast,
	previousPassed,
	busFraction,
	busAtStop,
	onPress,
}: {
	cell: StopStripCell
	index: number
	barColor: string
	dotColor: string
	isFirst: boolean
	isLast: boolean
	/** Whether the bus has left the stop before this one, so the leg in is solid. */
	previousPassed: boolean
	/** Where the bus sits relative to this cell's dot, in cells: -0.5 to +0.5. */
	busFraction?: number
	/** Whether the bus is sitting on this cell's dot. */
	busAtStop?: boolean
	onPress: () => void
}): React.ReactNode {
	let time = formatDeparture(cell.time)
	let isPassed = cell.stopStatus === 'after'
	let isSkipped = cell.stopStatus === 'skip'
	let isHere = cell.stopStatus === 'at'

	// The rail behind the bus is solid and the rail ahead is faint, and the two
	// halves of a cell answer separately: the half to the left belongs to the
	// leg in from the stop before, the half to the right to the leg out to the
	// next. So the leg the bus is on is solid all the way across rather than
	// changing colour under it.
	let leadingActive = previousPassed
	let trailingActive = isPassed

	// `busFraction` is where the bus sits relative to this cell's own dot, in
	// cells, and never exceeds half a cell. Every cell is the same known width,
	// so the bus sits at its true point on the leg with nothing measured.
	let busOffset = busFraction == null || busAtStop ? null : CELL_WIDTH * busFraction

	return (
		<Button
			modifiers={[
				buttonStyle('plain'),
				accessibilityLabel(`${cell.name}, ${time}`),
				id(String(index)),
				frame({width: CELL_WIDTH}),
			]}
			onPress={onPress}
		>
			<VStack modifiers={[contentShape(shapes.rectangle())]} spacing={6}>
				<Text
					modifiers={[
						font({textStyle: 'footnote', weight: isHere ? 'semibold' : 'regular'}),
						foregroundStyle(isSkipped ? c.tertiaryLabel : c.label),
					]}
				>
					{time}
				</Text>

				<ZStack modifiers={[frame({width: CELL_WIDTH, height: DOT_SIZE})]}>
					{/* Two halves rather than one bar: the rail has to stop at the
					    first and last dot, and a cell only knows about its own
					    half of each gap. Both are always drawn and the end caps
					    are made transparent, so every cell lays out identically.
					    `Rectangle` rather than `Capsule`: a capsule rounds both ends,
					    so two adjacent cells' halves would pinch where they meet
					    instead of reading as one line. */}
					<HStack spacing={0}>
						<Rectangle
							modifiers={[
								frame({width: CELL_WIDTH / 2, height: RAIL_HEIGHT}),
								foregroundStyle(barColor),
								opacity(isFirst ? 0 : leadingActive ? 1 : RAIL_AHEAD_OPACITY),
							]}
						/>
						<Rectangle
							modifiers={[
								frame({width: CELL_WIDTH / 2, height: RAIL_HEIGHT}),
								foregroundStyle(barColor),
								opacity(isLast ? 0 : trailingActive ? 1 : RAIL_AHEAD_OPACITY),
							]}
						/>
					</HStack>

					{busAtStop ? (
						<BusGlyph color={dotColor} />
					) : (
						<StopDot
							barColor={barColor}
							dotColor={dotColor}
							isHere={isHere}
							isPassed={isPassed}
							isSkipped={isSkipped}
						/>
					)}

					{busOffset === null ? null : (
						<BusGlyph color={dotColor} modifiers={[offset({x: busOffset})]} />
					)}
				</ZStack>

				<Text
					modifiers={[
						font({textStyle: 'caption'}),
						foregroundStyle(isSkipped ? c.tertiaryLabel : c.secondaryLabel),
						frame({width: CELL_WIDTH}),
					]}
				>
					{cell.name}
				</Text>
			</VStack>
		</Button>
	)
}

/**
 * The end of the loop: when the next round begins. Greyed and inert to the
 * eye -- there is no stop behind it, so it is a note rather than a
 * destination -- but still a `Button`, so the strip has no dead patch at its
 * far end.
 */
function NextRoundCell({time, onPress}: {time: Moment; onPress: () => void}): React.ReactNode {
	let label = formatDeparture(time)

	return (
		<Button
			modifiers={[
				buttonStyle('plain'),
				frame({width: CELL_WIDTH}),
				accessibilityElement('combine'),
				accessibilityLabel(`Next departure, ${label}`),
			]}
			onPress={onPress}
		>
			<VStack modifiers={[contentShape(shapes.rectangle())]} spacing={6}>
				<Text modifiers={[font({textStyle: 'footnote'}), foregroundStyle(c.tertiaryLabel)]}>
					{label}
				</Text>

				<ZStack modifiers={[frame({width: CELL_WIDTH, height: DOT_SIZE})]}>
					<HStack spacing={0}>
						<Rectangle
							modifiers={[
								frame({width: CELL_WIDTH / 2, height: RAIL_HEIGHT}),
								foregroundStyle(c.tertiaryLabel),
								opacity(0.35),
							]}
						/>
						<Rectangle
							modifiers={[
								frame({width: CELL_WIDTH / 2, height: RAIL_HEIGHT}),
								foregroundStyle(c.tertiaryLabel),
								opacity(0),
							]}
						/>
					</HStack>

					{/* `systemGray3` rather than `tertiaryLabel`: the label color is
					    itself semi-transparent, so the rail would still show through
					    it even at `opacity(1)`. This dot is meant to read as solid. */}
					<Circle
						modifiers={[frame({width: DOT_SIZE, height: DOT_SIZE}), foregroundStyle(c.systemGray3)]}
					/>
				</ZStack>

				<Text
					modifiers={[
						font({textStyle: 'caption'}),
						foregroundStyle(c.tertiaryLabel),
						frame({width: CELL_WIDTH}),
					]}
				>
					Next departure
				</Text>
			</VStack>
		</Button>
	)
}

/**
 * One bus line at a glance: what it is doing right now, and its route as a
 * strip you can push sideways. A tap anywhere on the widget -- the header or
 * any cell in the strip -- opens the line's full timetable.
 */
export function BusLineWidget({line, now, onPress}: Props): React.ReactNode {
	let {subtitle, status, schedule, currentBusIteration, parkedStopIndex} = deriveLineState({
		line,
		now,
	})
	let {cells, currentIndex, nextRoundStart} = buildStopStrip({
		schedule,
		busStatus: status,
		departureIndex: currentBusIteration,
		now,
	})
	let busTarget = findBusTarget(
		schedule,
		{status, index: currentBusIteration, parkedStopIndex},
		now,
	)
	let scrollTarget = useNativeState<string | null>(null)

	// The strip opens on the stop behind the bus, so the leg it is on has both
	// ends in view and everything earlier is still there to scroll back to.
	//
	// Set from the scroll geometry rather than at mount: the position only
	// takes once the strip has width to scroll, and the `null` guard means it
	// happens once -- a reader who scrolls somewhere else is left there, and
	// the strip does not chase the bus every minute. The calendar's event list
	// opens on today the same way.
	let anchorIndex = stripAnchorIndex(busTarget, currentIndex)
	// A string because it addresses a cell by its SwiftUI id.
	let anchorId = anchorIndex === null ? null : String(anchorIndex)
	let openOnTheBus = React.useCallback(
		(geometry: ScrollGeometry) => {
			'worklet'
			if (anchorId !== null && geometry.contentWidth > 0 && scrollTarget.get() === null) {
				scrollTarget.set(anchorId)
			}
		},
		[anchorId, scrollTarget],
	)
	let placement = useScrollGeometryChange(openOnTheBus)

	// SwiftUI colors want strings; the feed gives hex, but the type is RN's
	// wider ColorValue.
	let barColor = String(line.colors.bar)
	let dotColor = String(line.colors.dot)

	return (
		<Section>
			<Button
				modifiers={[buttonStyle('plain'), accessibilityLabel(`${line.line}, ${subtitle}`)]}
				onPress={onPress}
			>
				<HStack
					modifiers={[contentShape(shapes.rectangle()), frame({maxWidth: FILL_WIDTH})]}
					spacing={8}
				>
					{/* Tinted with the line's own dot color -- the same cue the old
					    native tab bar gave each bus line before the tabs went away.
					    The header's accessibility label already names the line, so
					    this carries no label of its own. */}
					<Image
						modifiers={[font({textStyle: 'body'}), foregroundStyle(barColor)]}
						systemName="bus.fill"
					/>
					<Text modifiers={[font({weight: 'semibold'})]}>{line.line}</Text>
					<Spacer />
					<Text modifiers={[font({textStyle: 'subheadline'}), foregroundStyle(c.secondaryLabel)]}>
						{subtitle}
					</Text>
					<Image
						modifiers={[font({textStyle: 'footnote'}), foregroundStyle(c.tertiaryLabel)]}
						systemName="chevron.right"
					/>
				</HStack>
			</Button>

			{/* An idle line collapses to its header: the status there already says
			    so, and a placeholder card would push the lines below it off screen. */}
			{cells.length === 0 ? null : (
				<ScrollView
					axes="horizontal"
					modifiers={[
						listRowInsets({top: 12, bottom: 12, leading: 0, trailing: 0}),
						listRowSeparator('hidden'),
						scrollPosition(scrollTarget, {anchor: 'leading'}),
						...(placement ? [placement] : []),
					]}
					showsIndicators={false}
				>
					{/* `scrollPosition` above only lands if the content it scrolls says
					    which of its children are targets, so the stack carries
					    `scrollTargetLayout`. Without it the anchor is set and
					    silently ignored, and the strip opens at the first stop. */}
					<LazyHStack alignment="top" modifiers={[scrollTargetLayout()]} spacing={0}>
						{cells.map((cell, index) => (
							<StopCell
								// oxlint-disable-next-line react/no-array-index-key -- a loop route visits a stop twice
								key={`${cell.name}-${index}`}
								barColor={barColor}
								cell={cell}
								dotColor={dotColor}
								index={index}
								isFirst={index === 0}
								// The faux stop, when there is one, is the rail's real end.
								isLast={index === cells.length - 1 && nextRoundStart === null}
								previousPassed={cells[index - 1]?.stopStatus === 'after'}
								onPress={onPress}
								{...busPropsForRow(busTarget, index)}
							/>
						))}
						{nextRoundStart ? <NextRoundCell onPress={onPress} time={nextRoundStart} /> : null}
					</LazyHStack>
				</ScrollView>
			)}
		</Section>
	)
}
