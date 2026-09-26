import * as React from 'react'
import {Button, HStack, Image, Spacer, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityElement,
	accessibilityHidden,
	accessibilityLabel,
	background,
	buttonStyle,
	dynamicTypeSize,
	font,
	foregroundStyle,
	frame,
	lineLimit,
	multilineTextAlignment,
	padding,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {openUrl} from '@frogpond/open-url'

import {FILL_WIDTH} from '../../../components/tile-layout'
import type {PlaceTile} from '../lib/place-tiles'

// Maps' "Also at This Location" tiles, measured on iOS 27: about 170 by 124pt
// (taller at large text sizes, so a name is never cut short),
// with 20pt corners, a small round icon and a bold name of up to three lines.

/// The carousel's tile width; tiles in the More grid fill their column instead.
export const PLACE_TILE_WIDTH = 170
const TILE_HEIGHT = 124
const CORNER_RADIUS = 20
const ICON_SIZE = 28

/// How many of the hidden names the carousel's last tile shows.
const MORE_PREVIEW = 3

/// A tile's card. In the carousel every tile stretches to the tallest, so
/// the row stays even when large text makes one name wrap further; in the
/// More grid a tile fills its column.
function cardFrame(fill: boolean) {
	return [
		padding({all: 14}),
		frame(
			fill
				? {maxWidth: FILL_WIDTH, minHeight: TILE_HEIGHT, alignment: 'topLeading'}
				: {
						width: PLACE_TILE_WIDTH,
						minHeight: TILE_HEIGHT,
						maxHeight: FILL_WIDTH,
						alignment: 'topLeading',
					},
		),
		background(
			c.secondarySystemGroupedBackground,
			shapes.roundedRectangle({cornerRadius: CORNER_RADIUS}),
		),
	]
}

const SYMBOL = {
	department: 'building.2.fill',
	office: 'person.2.fill',
} as const

/// One department or office, as a Maps place tile. A tile with a link opens
/// it; one without is only the card.
export function PlaceTileView({
	tile,
	fill = false,
}: {
	tile: PlaceTile
	fill?: boolean
}): React.ReactNode {
	let symbol = SYMBOL[tile.kind]
	let card = (
		<VStack
			alignment="leading"
			modifiers={[
				...cardFrame(fill),
				// One element, linked or not: the name is all there is to read.
				accessibilityElement('combine'),
			]}
			spacing={6}
		>
			<Image
				modifiers={[
					font({textStyle: 'footnote'}),
					// The circle keeps its size at every text size, so the glyph
					// in it has to as well.
					dynamicTypeSize({max: 'large'}),
					foregroundStyle('white'),
					frame({width: ICON_SIZE, height: ICON_SIZE}),
					background(c.systemGray, shapes.circle()),
					// The section's heading already says which kind this is.
					accessibilityHidden(true),
				]}
				systemName={symbol}
			/>
			<Text
				modifiers={[font({textStyle: 'headline'}), lineLimit(3), multilineTextAlignment('leading')]}
			>
				{tile.label}
			</Text>
			<Spacer />
		</VStack>
	)
	let href = tile.href
	if (!href) {
		return card
	}
	return (
		<Button
			modifiers={[buttonStyle('plain'), accessibilityLabel(`Open ${tile.label}`)]}
			onPress={() => openUrl(href)}
		>
			{card}
		</Button>
	)
}

/// The tile that ends a carousel with more than it shows: the next few names
/// it left out, so the one wanted may be among them, and a tinted count that
/// opens the same grid as the heading's More.
export function MoreTileView({
	hidden,
	total,
	noun,
	onPress,
}: {
	/// The names the carousel left out, in order.
	hidden: Array<string>
	/// How many there are in all, for VoiceOver.
	total: number
	/// The plural, lowercase: "departments".
	noun: string
	onPress: () => void
}): React.ReactNode {
	let preview = hidden.slice(0, MORE_PREVIEW).join(', ') + (hidden.length > MORE_PREVIEW ? '…' : '')
	return (
		<Button
			modifiers={[buttonStyle('plain'), accessibilityLabel(`Show all ${total} ${noun}`)]}
			onPress={onPress}
		>
			<VStack alignment="leading" modifiers={cardFrame(false)} spacing={6}>
				<Text
					modifiers={[
						font({textStyle: 'subheadline'}),
						foregroundStyle({type: 'hierarchical', style: 'secondary'}),
						lineLimit(3),
					]}
				>
					{preview}
				</Text>
				<Spacer />
				<HStack spacing={4}>
					<Text modifiers={[font({textStyle: 'headline'}), foregroundStyle(c.systemBlue)]}>
						{`${hidden.length} more`}
					</Text>
					<Image
						modifiers={[
							font({textStyle: 'footnote', weight: 'bold'}),
							foregroundStyle(c.systemBlue),
						]}
						systemName="chevron.right"
					/>
				</HStack>
			</VStack>
		</Button>
	)
}
