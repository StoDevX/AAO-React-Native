import * as React from 'react'
import {Button, Image, Spacer, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityLabel,
	background,
	buttonStyle,
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

// Maps' "Also at This Location" tiles, measured on iOS 27: about 170 by 124pt,
// with 20pt corners, a small round icon and a bold name of up to three lines.

/// The carousel's tile width; tiles in the More grid fill their column instead.
export const PLACE_TILE_WIDTH = 170
const TILE_HEIGHT = 124
const CORNER_RADIUS = 20
const ICON_SIZE = 28

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
				padding({all: 14}),
				frame(
					fill
						? {maxWidth: FILL_WIDTH, minHeight: TILE_HEIGHT, alignment: 'topLeading'}
						: {width: PLACE_TILE_WIDTH, height: TILE_HEIGHT, alignment: 'topLeading'},
				),
				background(
					c.secondarySystemGroupedBackground,
					shapes.roundedRectangle({cornerRadius: CORNER_RADIUS}),
				),
			]}
			spacing={6}
		>
			<Image
				modifiers={[
					font({textStyle: 'footnote'}),
					foregroundStyle('white'),
					frame({width: ICON_SIZE, height: ICON_SIZE}),
					background(c.systemGray, shapes.circle()),
				]}
				systemName={symbol}
			/>
			<Text
				modifiers={[font({textStyle: 'headline'}), lineLimit(2), multilineTextAlignment('leading')]}
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
