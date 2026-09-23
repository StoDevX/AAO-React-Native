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
	accessibilityIdentifier,
	accessibilityLabel,
	buttonStyle,
	contentShape,
	font,
	foregroundStyle,
	frame,
	id,
	listRowInsets,
	listRowSeparator,
	multilineTextAlignment,
	offset,
	opacity,
	scrollPosition,
	useScrollGeometryChange,
	scrollTargetBehavior,
	scrollTargetLayout,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import type {ScrollGeometry} from '@expo/ui/swift-ui'
import type {Moment} from 'moment-timezone'

import * as c from '@frogpond/colors'
import {FILL_WIDTH} from '../../../components/tile-layout'
import {formatDeparture, NOT_SERVED_SPOKEN} from './components/times'
import {BusGlyph} from './components/timetable-row'
import {
	buildStopStrip,
	busPropsForCell,
	findBusTarget,
	legsBehindTheBus,
	stripAnchorIndex,
	type StopStripCell,
} from './lib'
import type {UnprocessedBusLine} from './types'
import {useLineState} from './use-line-state'

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
/// Stands in for the time in the end cell when no later bus runs today, so its
/// dot still lines up with the rail the stops sit on.
const NO_LATER_DEPARTURE = '—'
/// The strip itself, for a UI test to aim a sideways swipe at. A stop cell is
/// no use for that: the strip opens partway along the route, so which cells
/// are on screen depends on where the bus is.
/// Mirrored by `TestIdentifiers.Transportation.stopStrip`.
export const STOP_STRIP = 'stop-strip'

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
	legInSolid,
	legOutSolid,
	busFraction,
	busAtStop,
	onPress,
}: {
	cell: StopStripCell
	index: number
	barColor: string
	dotColor: string
	isFirst: boolean
	/** Whether the rail ends at this stop, with no leg out of it. */
	isLast: boolean
	/** Whether the leg arriving at this stop is behind the bus, so drawn solid. */
	legInSolid: boolean
	/** Whether the leg leaving this stop is behind the bus, so drawn solid. */
	legOutSolid: boolean
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

	// `busFraction` is where the bus sits relative to this cell's own dot, in
	// cells, and never reaches half a cell -- `busPropsForCell` hands the bus to
	// whichever of the two stops is nearer. Every cell is the same known width,
	// so the bus sits at its true point on the leg with nothing measured.
	let busOffset = busFraction == null || busAtStop ? null : CELL_WIDTH * busFraction

	return (
		<Button
			modifiers={[
				buttonStyle('plain'),
				accessibilityLabel(`${cell.name}, ${cell.time?.isValid() ? time : NOT_SERVED_SPOKEN}`),
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
					{/* Two halves rather than one bar: the rail has to stop at
					    the ends of the route, and each half belongs to a
					    different leg -- the one in from the stop before, and the
					    one out to the next -- so the leg the bus is on stays solid
					    all the way across rather than changing colour under it.
					    Both are always drawn, and the caps at either end are made
					    transparent, so every cell lays out identically.
					    `Rectangle` rather than `Capsule`: a capsule rounds both ends,
					    so two adjacent cells' halves would pinch where they meet
					    instead of reading as one line. */}
					<HStack spacing={0}>
						<Rectangle
							modifiers={[
								frame({width: CELL_WIDTH / 2, height: RAIL_HEIGHT}),
								foregroundStyle(barColor),
								opacity(isFirst ? 0 : legInSolid ? 1 : RAIL_AHEAD_OPACITY),
							]}
						/>
						<Rectangle
							modifiers={[
								frame({width: CELL_WIDTH / 2, height: RAIL_HEIGHT}),
								foregroundStyle(barColor),
								opacity(isLast ? 0 : legOutSolid ? 1 : RAIL_AHEAD_OPACITY),
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
						multilineTextAlignment('center'),
					]}
				>
					{cell.name}
				</Text>
			</VStack>
		</Button>
	)
}

/**
 * The far end of the strip: when the next round begins, or -- once the day's
 * last round is on screen -- that there is no next round. Greyed and inert to
 * the eye, since there is no stop behind it, but still a `Button`, so the
 * strip has no dead patch at its far end.
 *
 * A slot either way: a rail that simply stopped at the last stop left the
 * reader to work out whether another bus follows.
 */
function RouteEndCell({
	cellId,
	time,
	onPress,
}: {
	/**
	 * Its SwiftUI id. Every child of the `scrollTargetLayout()` stack needs
	 * one: a child the scroll view cannot name reports itself as `nil`, which
	 * lands in the binding `scrollPosition` is reading.
	 */
	cellId: string
	time: Moment | null
	onPress: () => void
}): React.ReactNode {
	let label = time ? formatDeparture(time) : NO_LATER_DEPARTURE

	return (
		<Button
			modifiers={[
				buttonStyle('plain'),
				id(cellId),
				frame({width: CELL_WIDTH}),
				accessibilityElement('combine'),
				accessibilityLabel(time ? `Next departure, ${label}` : 'Last bus of the day'),
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
								opacity(time ? 0.35 : 0),
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
					    it even at `opacity(1)`. These are meant to read as solid.

					    A round still to come gets a filled dot -- another bus stands
					    there. The end of the day gets the ring an unvisited stop
					    wears with nothing inside it: a slot no bus will fill. */}
					{time ? (
						<Circle
							modifiers={[
								frame({width: DOT_SIZE, height: DOT_SIZE}),
								foregroundStyle(c.systemGray3),
							]}
						/>
					) : (
						<ZStack>
							<Circle
								modifiers={[
									frame({width: DOT_SIZE, height: DOT_SIZE}),
									foregroundStyle(c.systemGray3),
								]}
							/>
							<Circle
								modifiers={[
									frame({width: FUTURE_HOLE_SIZE, height: FUTURE_HOLE_SIZE}),
									foregroundStyle(c.secondarySystemGroupedBackground),
								]}
							/>
						</ZStack>
					)}
				</ZStack>

				<Text
					modifiers={[
						font({textStyle: 'caption'}),
						foregroundStyle(c.tertiaryLabel),
						frame({width: CELL_WIDTH}),
						multilineTextAlignment('center'),
					]}
				>
					{/* Broken by hand: on one line it fills the cell edge to edge and
					    runs into the card's corner. */}
					{time ? 'Next\ndeparture' : 'Last bus'}
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
	let {subtitle, status, schedule, currentBusIteration, parkedStopIndex} = useLineState({
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
	// Leg `n` runs from stop `n` to stop `n + 1`, and the ones below this count
	// are behind the bus, so drawn solid.
	let legsBehind = legsBehindTheBus(cells, busTarget)
	let scrollTarget = useNativeState<string | null>(null)

	// Whether the strip has been aimed yet. A flag of its own rather than a
	// `null` check on `scrollTarget`, which is written from both directions:
	// the scroll view reports the cell it has settled on back into it, so
	// reading it here would both miss the first chance -- a report can land
	// before the strip has width to scroll -- and take a later one, jumping
	// the strip back to the bus after the reader had scrolled away.
	let hasAnchored = useNativeState(false)

	// The strip opens on the stop behind the bus, so the leg it is on has both
	// ends in view and everything earlier is still there to scroll back to.
	//
	// Set from the scroll geometry rather than at mount: the position only
	// takes once the strip has width to scroll. It happens once -- a reader who
	// scrolls somewhere else is left there, and the strip does not chase the
	// bus every minute. The calendar's event list opens on today the same way.
	let anchorIndex = stripAnchorIndex(busTarget, currentIndex)
	// A string because it addresses a cell by its SwiftUI id.
	let anchorId = anchorIndex === null ? null : String(anchorIndex)
	let openOnTheBus = React.useCallback(
		(geometry: ScrollGeometry) => {
			'worklet'
			if (anchorId !== null && geometry.contentWidth > 0 && !hasAnchored.get()) {
				hasAnchored.set(true)
				scrollTarget.set(anchorId)
			}
		},
		[anchorId, hasAnchored, scrollTarget],
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
						accessibilityIdentifier(STOP_STRIP),
						scrollPosition(scrollTarget, {anchor: 'leading'}),
						// The strip comes to rest with a stop against its leading
						// edge rather than mid-gap, so what it shows always reads as
						// a run of whole stops.
						scrollTargetBehavior('viewAligned'),
						...(placement ? [placement] : []),
						// Last, so they wrap everything above: modifiers apply from
						// the top of this list outwards, and a row modifier reaches
						// the row only from outside the scroll view. Applied first,
						// `scrollTargetBehavior` sat outside them and the strip drew
						// inset from the card's edges with a separator under the
						// header.
						listRowInsets({top: 12, bottom: 12, leading: 0, trailing: 0}),
						listRowSeparator('hidden'),
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
								// No bus leaves the last stop of the day, so the rail
								// stops there and the end slot stands on its own.
								isLast={index === cells.length - 1 && nextRoundStart === null}
								legInSolid={index - 1 < legsBehind}
								legOutSolid={index < legsBehind}
								onPress={onPress}
								{...busPropsForCell(busTarget, index)}
							/>
						))}
						<RouteEndCell cellId={String(cells.length)} onPress={onPress} time={nextRoundStart} />
					</LazyHStack>
				</ScrollView>
			)}
		</Section>
	)
}
