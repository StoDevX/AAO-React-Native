import * as React from 'react'
import {StyleSheet, type ColorValue} from 'react-native'
import {HStack, Image, Text, VStack, ZStack} from '@expo/ui/swift-ui'
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
import {formatHourLabel, listTimeLines} from './times'

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
 * no `GeometryReader`, so the card's usable width cannot be read at runtime,
 * and cannot adapt to the device it runs on. Bounded by the narrowest phone
 * this app supports -- a 375pt iPhone SE -- rather than by the widest: at
 * this width the row totals roughly 230 + 56 (label column) + 8 (spacing) +
 * insets ≈ 344pt, comfortably inside 375pt. A wider value would fill more of
 * a 393pt iPhone 15 Pro's card but clip on the SE, and clipping on the
 * smallest screen costs more than a few empty points on the largest.
 */
const BLOCK_AREA_WIDTH = 230

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
				// `trailing` puts every label's near edge on the same line, the
				// edge nearest the grid -- so `9 AM` and `10 AM` share an edge,
				// matching Calendar.app, instead of centring in the 56pt column.
				frame({minWidth: LABEL_COLUMN, maxWidth: LABEL_COLUMN, alignment: 'trailing'}),
				offset({y: index * HOUR_HEIGHT}),
			]}
		>
			{hour}
		</Text>
	)
}

function Gridline({index}: {index: number}): React.ReactNode {
	return (
		<VStack
			modifiers={[
				// Same fixed-size-via-min/max idiom the accent bars use elsewhere in
				// this feature -- the native `frame` ignores min/max once width or
				// height is set.
				frame({
					minWidth: BLOCK_AREA_WIDTH,
					maxWidth: BLOCK_AREA_WIDTH,
					minHeight: StyleSheet.hairlineWidth,
					maxHeight: StyleSheet.hairlineWidth,
				}),
				background(c.separator),
				offset({y: index * HOUR_HEIGHT}),
			]}
		>
			{null}
		</VStack>
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
				// `padding` has to sit inside `frame`, not after it: a modifier
				// wraps everything before it, so padding placed after a
				// height-locked frame grows past the height `timeline.ts` computed.
				padding({all: 4}),
				frame({minWidth: width, maxWidth: width, minHeight: block.height, maxHeight: block.height}),
				background(color),
				clipShape('roundedRectangle'),
				offset({x: block.column * (width + BLOCK_GAP), y: block.top}),
			]}
		>
			<Text modifiers={[font({textStyle: 'caption', weight: 'semibold'})]}>
				{block.event.title}
			</Text>
			{location ? (
				<HStack alignment="firstTextBaseline" spacing={4}>
					<Image modifiers={[font({textStyle: 'caption2'})]} systemName="location.circle" />
					<Text modifiers={[font({textStyle: 'caption2'})]}>{location}</Text>
				</HStack>
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
			{/* `offset` is a post-layout transform: it moves a view after the view
			has already been placed, it does not choose where the view is placed.
			Placement is the stack's own alignment, and both `ZStack` and `frame`
			default to centre -- so without an explicit `topLeading` alignment
			here, every offset below is measured from the stack's centre instead
			of its top-left corner, and a block far from filling the stack lands
			far from where its `top`/`left` values say it should. */}
			<ZStack
				alignment="topLeading"
				modifiers={[
					frame({
						minWidth: LABEL_COLUMN,
						maxWidth: LABEL_COLUMN,
						minHeight: WINDOW_HEIGHT,
						maxHeight: WINDOW_HEIGHT,
						alignment: 'topLeading',
					}),
				]}
			>
				{window.hours.map((hour, index) => (
					<HourLabel
						hour={formatHourLabel(hour, undefined)}
						index={index}
						key={hour.toISOString()}
					/>
				))}
			</ZStack>

			<ZStack
				alignment="topLeading"
				modifiers={[
					frame({
						minWidth: BLOCK_AREA_WIDTH,
						maxWidth: BLOCK_AREA_WIDTH,
						minHeight: WINDOW_HEIGHT,
						maxHeight: WINDOW_HEIGHT,
						alignment: 'topLeading',
					}),
				]}
			>
				{window.hours.map((hour, index) => (
					<Gridline index={index} key={hour.toISOString()} />
				))}
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
