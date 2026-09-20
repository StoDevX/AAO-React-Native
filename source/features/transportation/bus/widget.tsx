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
	shapes,
} from '@expo/ui/swift-ui/modifiers'
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
	type StopStripCell,
} from './lib'
import type {UnprocessedBusLine} from './types'

/// Wide enough for "Buntrock Commons" to wrap to two lines rather than
/// truncate, narrow enough that four cells are visible at once on a 393pt
/// screen.
const CELL_WIDTH = 86
/// Height of the rail the dots sit on.
const RAIL_HEIGHT = 3
/// Diameter of a stop's dot.
const DOT_SIZE = 11

type Props = {
	line: UnprocessedBusLine
	now: Moment
	/** Opens the line's full timetable, from anywhere in the widget. */
	onPress: () => void
}

function StopCell({
	cell,
	index,
	barColor,
	dotColor,
	isFirst,
	isLast,
	busProgress,
	busAtStop,
	onPress,
}: {
	cell: StopStripCell
	index: number
	barColor: string
	dotColor: string
	isFirst: boolean
	isLast: boolean
	/** How far the bus is along the leg into this cell, when it is on that leg. */
	busProgress?: number
	/** Whether the bus is sitting on this cell's dot. */
	busAtStop?: boolean
	onPress: () => void
}): React.ReactNode {
	let time = formatDeparture(cell.time)
	let isPassed = cell.stopStatus === 'after'
	let isSkipped = cell.stopStatus === 'skip'
	let isHere = cell.stopStatus === 'at'

	// A leg the bus has already driven is solid; one still ahead of it is faint.
	let railOpacity = isPassed ? 1 : 0.35

	// The leg into this cell is the previous cell's right half plus this
	// cell's left half: CELL_WIDTH long, starting half a cell left of this
	// dot. Every cell is the same known width, so the bus can sit at its true
	// fraction of the leg with nothing measured.
	let busOffset =
		busProgress == null || busAtStop ? null : busProgress * CELL_WIDTH - CELL_WIDTH / 2

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
								opacity(isFirst ? 0 : railOpacity),
							]}
						/>
						<Rectangle
							modifiers={[
								frame({width: CELL_WIDTH / 2, height: RAIL_HEIGHT}),
								foregroundStyle(barColor),
								opacity(isLast ? 0 : railOpacity),
							]}
						/>
					</HStack>

					{busAtStop ? (
						<BusGlyph color={dotColor} />
					) : (
						<Circle
							modifiers={[
								frame({width: DOT_SIZE, height: DOT_SIZE}),
								foregroundStyle(isHere ? dotColor : barColor),
								opacity(isSkipped ? 0.25 : 1),
							]}
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

	// The strip opens at the stop the bus is at, or the next one ahead, rather
	// than at the start of the route -- a bus halfway round its loop is the
	// thing the reader came to see. `useNativeState` captures this initial
	// value once on mount, so the strip does not chase the bus every minute
	// and does not stomp a scroll the reader made themselves.
	let scrollTarget = useNativeState<string | null>(
		currentIndex === null ? null : String(currentIndex),
	)

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
						scrollPosition(scrollTarget),
					]}
					showsIndicators={false}
				>
					<LazyHStack alignment="top" spacing={0}>
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
