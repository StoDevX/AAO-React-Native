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
	opacity,
	padding,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'

import {HOUR_HEIGHT, type TimelineBlock, type TimelineWindow} from './timeline'
import {formatHourLabel, listTimeLines} from './times'

/**
 * The width the hour labels take, leaving the rest for blocks. Fixed, because
 * `@expo/ui` exposes no `GeometryReader` -- there is nothing to measure
 * against, so every position here is computed rather than laid out.
 */
const LABEL_COLUMN = 56

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

/**
 * How far across the block area the current event's lane starts, measured
 * from a Calendar.app screenshot of a 12:40-13:40 event with three
 * overlapping neighbours: the open event begins about 45% of the way across.
 */
const CURRENT_LANE_FRACTION = 0.45

/**
 * How much further right each successive staggered neighbour sits, measured
 * from the same screenshot.
 */
export const DEPTH_INDENT = 11

/**
 * Width of a neighbour's full-brightness accent bar -- the same width the
 * list row's and detail header's accent bars use.
 */
const ACCENT_BAR_WIDTH = 4

/**
 * Opacity of a neighbour's fill. Approximates the screenshot's dimmed blue
 * against the open event's solid one; the exact ratio isn't recoverable from
 * a screenshot alone without knowing what's layered behind it, and colour is
 * unassertable in Jest besides -- verify by eye on the simulator.
 */
const NEIGHBOUR_FILL_OPACITY = 0.35

function titleText(block: TimelineBlock, color?: ColorValue): React.ReactNode {
	let {start} = listTimeLines(block.event)
	let location = block.event[block.event.config.subtitle]?.trim()
	let textColor = color ? [foregroundStyle(color)] : []

	return (
		<>
			<Text modifiers={[font({textStyle: 'caption', weight: 'semibold'}), ...textColor]}>
				{block.event.title}
			</Text>
			{location ? (
				<HStack alignment="firstTextBaseline" spacing={4}>
					<Image
						modifiers={[font({textStyle: 'caption2'}), ...textColor]}
						systemName="location.circle"
					/>
					<Text modifiers={[font({textStyle: 'caption2'}), ...textColor]}>{location}</Text>
				</HStack>
			) : null}
			<Text modifiers={[font({textStyle: 'caption2'}), ...textColor]}>{start}</Text>
		</>
	)
}

/**
 * The event being viewed: solid fill, full opacity, drawn last so it lands on
 * top of every neighbour behind it -- `timelineBlocks` already orders the
 * array that way.
 */
function CurrentBlock({block, color}: {block: TimelineBlock; color: ColorValue}): React.ReactNode {
	let offsetX = CURRENT_LANE_FRACTION * BLOCK_AREA_WIDTH
	let width = BLOCK_AREA_WIDTH - offsetX

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
				offset({x: offsetX, y: block.top}),
			]}
		>
			{titleText(block)}
		</VStack>
	)
}

/**
 * An overlapping event other than the one being viewed: indented by its
 * depth and layered behind whatever came before it, dimmed so the current
 * event reads as the one in focus. Its accent bar stays full-brightness --
 * `opacity` sits only on the fill layer behind the text, not on the block as
 * a whole, or the bar and text would dim along with it.
 */
function NeighbourBlock({
	block,
	color,
}: {
	block: TimelineBlock
	color: ColorValue
}): React.ReactNode {
	let offsetX = block.depth * DEPTH_INDENT
	let width = BLOCK_AREA_WIDTH - offsetX
	let contentWidth = width - ACCENT_BAR_WIDTH

	return (
		<HStack
			spacing={0}
			modifiers={[
				frame({minWidth: width, maxWidth: width, minHeight: block.height, maxHeight: block.height}),
				clipShape('roundedRectangle'),
				offset({x: offsetX, y: block.top}),
			]}
		>
			{/* Same fixed-width-via-min/max idiom the list row's and detail
			header's accent bars use -- the native `frame` ignores min/max once
			width or height is set. */}
			<VStack
				modifiers={[
					frame({
						minWidth: ACCENT_BAR_WIDTH,
						maxWidth: ACCENT_BAR_WIDTH,
						minHeight: block.height,
						maxHeight: block.height,
					}),
					background(color),
					clipShape('capsule'),
				]}
			>
				{null}
			</VStack>
			<ZStack
				alignment="topLeading"
				modifiers={[
					frame({
						minWidth: contentWidth,
						maxWidth: contentWidth,
						minHeight: block.height,
						maxHeight: block.height,
						alignment: 'topLeading',
					}),
				]}
			>
				{/* The dimmed fill, alone -- `opacity` here doesn't reach the text
				stacked on top of it, since that text is a sibling layer rather
				than a child of this view. */}
				<VStack
					modifiers={[
						frame({
							minWidth: contentWidth,
							maxWidth: contentWidth,
							minHeight: block.height,
							maxHeight: block.height,
						}),
						background(color),
						opacity(NEIGHBOUR_FILL_OPACITY),
					]}
				>
					{null}
				</VStack>
				<VStack alignment="leading" modifiers={[padding({all: 4})]}>
					{titleText(block, color)}
				</VStack>
			</ZStack>
		</HStack>
	)
}

function Block({block, color}: {block: TimelineBlock; color: ColorValue}): React.ReactNode {
	return block.isCurrent ? (
		<CurrentBlock block={block} color={color} />
	) : (
		<NeighbourBlock block={block} color={color} />
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
	return (
		// The first and last hour labels sit exactly on the window's top and
		// bottom edges, so half their text would fall outside the card without
		// room to spill into. Measured from Calendar.app: 18pt above the first
		// label, 15pt below the last.
		<HStack alignment="top" spacing={8} modifiers={[padding({top: 18, bottom: 15})]}>
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
						minHeight: window.height,
						maxHeight: window.height,
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
						minHeight: window.height,
						maxHeight: window.height,
						alignment: 'topLeading',
					}),
				]}
			>
				{window.hours.map((hour, index) => (
					<Gridline index={index} key={hour.toISOString()} />
				))}
				{blocks.map((block) => (
					<Block block={block} color={colorFor(block.sourceId)} key={block.key} />
				))}
			</ZStack>
		</HStack>
	)
}
