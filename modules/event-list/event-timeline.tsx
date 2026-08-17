import * as React from 'react'
import type {ColorValue} from 'react-native'
import {HStack, Label, Text, VStack, ZStack} from '@expo/ui/swift-ui'
import {
	background,
	clipShape,
	font,
	foregroundStyle,
	frame,
	offset,
	padding,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'

import {HOUR_HEIGHT, type TimelineBlock, type TimelineWindow, WINDOW_HEIGHT} from './timeline'
import {listTimeLines} from './times'

/**
 * The width the hour labels take, leaving the rest for blocks. Fixed, because
 * `@expo/ui` exposes no `GeometryReader` -- there is nothing to measure
 * against, so every position here is computed rather than laid out.
 */
const LABEL_COLUMN = 56

const BLOCK_GAP = 2

/**
 * The width the blocks share, beside the label column.
 *
 * A constant because there is nothing to measure against: `@expo/ui` exposes
 * no `GeometryReader`, so the card's usable width cannot be read at runtime.
 * Tuned on the simulator against a grouped `Form`'s content width.
 */
const BLOCK_AREA_WIDTH = 200

type Props = {
	window: TimelineWindow
	blocks: TimelineBlock[]
	/**
	 * The tint for a block, by the calendar it came from -- the same mapping
	 * the list's rows use, passed in rather than derived: this component knows
	 * events, not which calendars are switched on.
	 */
	colorFor: (sourceId: string) => ColorValue
}

function HourLabel({hour, index}: {hour: string; index: number}): React.ReactNode {
	return (
		<Text
			modifiers={[
				font({textStyle: 'caption'}),
				foregroundStyle(c.secondaryLabel),
				offset({y: index * HOUR_HEIGHT}),
			]}
		>
			{hour}
		</Text>
	)
}

function Block({
	block,
	color,
	width,
}: {
	block: TimelineBlock
	color: ColorValue
	width: number
}): React.ReactNode {
	let {start} = listTimeLines(block.event)
	let location = block.event[block.event.config.subtitle]?.trim()

	return (
		<VStack
			alignment="leading"
			modifiers={[
				frame({minWidth: width, maxWidth: width, minHeight: block.height, maxHeight: block.height}),
				padding({all: 4}),
				background(color),
				clipShape('roundedRectangle'),
				offset({x: block.column * (width + BLOCK_GAP), y: block.top}),
			]}
		>
			<Text modifiers={[font({textStyle: 'caption', weight: 'semibold'})]}>
				{block.event.title}
			</Text>
			{location ? (
				<Label
					modifiers={[font({textStyle: 'caption2'})]}
					systemImage="location.circle"
					title={location}
				/>
			) : null}
			<Text modifiers={[font({textStyle: 'caption2'})]}>{start}</Text>
		</VStack>
	)
}

/**
 * Where the event falls in its own morning or afternoon, with whatever else is
 * on at the time -- the scheduling context Calendar.app's detail sheet gives.
 *
 * Everything is positioned by `offset` against a fixed 40pt hour rather than
 * laid out, because `@expo/ui` has no `GeometryReader` to measure with. The
 * geometry itself lives in `timeline.ts`, where Jest can reach it: appearance
 * here is verified on the simulator.
 */
export function EventTimeline({window, blocks, colorFor}: Props): React.ReactNode {
	let columnCount = Math.max(blocks[0]?.columnCount ?? 1, 1)
	let blockWidth = (BLOCK_AREA_WIDTH - BLOCK_GAP * (columnCount - 1)) / columnCount

	return (
		<HStack alignment="top" spacing={8}>
			<ZStack modifiers={[frame({minWidth: LABEL_COLUMN, maxWidth: LABEL_COLUMN})]}>
				{window.hours.map((hour, index) => (
					<HourLabel hour={hour.format('HH:mm')} index={index} key={hour.toISOString()} />
				))}
			</ZStack>

			<ZStack modifiers={[frame({minHeight: WINDOW_HEIGHT, maxHeight: WINDOW_HEIGHT})]}>
				{blocks.map((block) => (
					<Block
						block={block}
						color={colorFor(block.sourceId)}
						key={block.key}
						width={blockWidth}
					/>
				))}
			</ZStack>
		</HStack>
	)
}
