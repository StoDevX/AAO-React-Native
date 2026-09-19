import * as React from 'react'
import {
	Button,
	Capsule,
	Circle,
	ContentUnavailableView,
	HStack,
	Image,
	LazyHStack,
	ScrollView,
	Section,
	Spacer,
	Text,
	useNativeState,
	VStack,
	ZStack,
} from '@expo/ui/swift-ui'
import {
	accessibilityLabel,
	buttonStyle,
	contentShape,
	font,
	foregroundStyle,
	frame,
	id,
	listRowInsets,
	listRowSeparator,
	opacity,
	scrollPosition,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import type {Moment} from 'moment-timezone'

import * as c from '@frogpond/colors'
import {FILL_WIDTH} from '../../../components/tile-layout'
import {formatDeparture} from './components/times'
import {buildStopStrip, deriveFromProps, type StopStripCell} from './lib'
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
	/** Opens the line's full timetable. */
	onPressLine: () => void
	/** Opens one stop's departures. */
	onPressStop: (stopName: string) => void
}

function StopCell({
	cell,
	index,
	barColor,
	dotColor,
	isFirst,
	isLast,
	onPress,
}: {
	cell: StopStripCell
	index: number
	barColor: string
	dotColor: string
	isFirst: boolean
	isLast: boolean
	onPress: () => void
}): React.ReactNode {
	let time = formatDeparture(cell.time)
	let isPassed = cell.stopStatus === 'after'
	let isSkipped = cell.stopStatus === 'skip'
	let isHere = cell.stopStatus === 'at'

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
					{/* The rail is drawn per cell rather than once behind the row:
					    a LazyHStack builds its children as they scroll in, so
					    there is no single view spanning the whole route to hang a
					    rail off. The end caps are shortened so the line stops at
					    the first and last dot instead of running off the edge. */}
					<HStack spacing={0}>
						{isFirst ? <Spacer /> : null}
						<Capsule
							modifiers={[
								frame({maxWidth: FILL_WIDTH, height: RAIL_HEIGHT}),
								foregroundStyle(barColor),
								opacity(isPassed ? 1 : 0.35),
							]}
						/>
						{isLast ? <Spacer /> : null}
					</HStack>

					<Circle
						modifiers={[
							frame({width: DOT_SIZE, height: DOT_SIZE}),
							foregroundStyle(isHere ? dotColor : barColor),
							opacity(isSkipped ? 0.25 : 1),
						]}
					/>
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
 * One bus line at a glance: what it is doing right now, and its route as a
 * strip you can push sideways. The header opens the full timetable; a stop
 * opens that stop's own departures.
 */
export function BusLineWidget({line, now, onPressLine, onPressStop}: Props): React.ReactNode {
	let {subtitle, status, schedule, currentBusIteration} = deriveFromProps({line, now})
	let {cells, currentIndex} = buildStopStrip({
		schedule,
		busStatus: status,
		departureIndex: currentBusIteration,
		now,
	})

	// The strip opens at the stop the bus is at, or the next one ahead, rather
	// than at the start of the route -- a bus halfway round its loop is the
	// thing the reader came to see.
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
				onPress={onPressLine}
			>
				<HStack
					modifiers={[contentShape(shapes.rectangle()), frame({maxWidth: FILL_WIDTH})]}
					spacing={8}
				>
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

			{cells.length === 0 ? (
				<ContentUnavailableView
					description={`${line.line} keeps no schedule today.`}
					systemImage="bus"
					title="Not running today"
				/>
			) : (
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
								isLast={index === cells.length - 1}
								onPress={() => onPressStop(cell.name)}
							/>
						))}
					</LazyHStack>
				</ScrollView>
			)}
		</Section>
	)
}
