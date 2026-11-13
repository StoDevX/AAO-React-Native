import * as React from 'react'
import {useColorScheme} from 'react-native'

import {
	Box,
	Column,
	Icon,
	Text,
	getMaterialColors,
	useMaterialColors,
} from '@expo/ui/jetpack-compose'
import {
	background,
	clickable,
	clip,
	defaultMinSize,
	fillMaxWidth,
	paddingAll,
	semantics,
	Shapes,
	size,
} from '@expo/ui/jetpack-compose/modifiers'
import {displayP3Components} from '@frogpond/colors'

import {symbolSource} from '../../android-ui/components/symbol'
import type {HomeTileStyle} from './store'
import {opensInBrowser, type ViewType} from '../views'
import {sentenceCase} from '../../lib/ui-case'

/**
 * Material 3 Expressive shapes, dealt to the tiles in order, so neighbours
 * differ while the set stays one family. Shapes that read as a symbol of
 * their own -- a heart, a triangle, a ghost -- are left out.
 */
const SHAPES = [
	Shapes.Material.Cookie9Sided,
	Shapes.Material.Arch,
	Shapes.Material.Clover4Leaf,
	Shapes.Material.Sunny,
	Shapes.Material.Cookie6Sided,
	Shapes.Material.Slanted,
	Shapes.Material.PuffyDiamond,
	Shapes.Material.Cookie4Sided,
] as const

/** A shapes tile's shape, and the symbol inside it. */
const SHAPE_SIZE = 88
const SHAPE_ICON_SIZE = 36

/** A card's icon circle, and the symbol inside it. */
const CARD_ICON_BOX = 40
const CARD_ICON_SIZE = 22
const CARD_RADIUS = 24
const CARD_PADDING = 16
const CARD_MIN_HEIGHT = 104

type Props = {
	view: ViewType
	/** The tile's place on Home, which picks its shape. */
	index: number
	tileStyle: HomeTileStyle
	onPress: () => void
}

/** One channel, 0 to 1, as two hex digits. */
function channel(value: number): string {
	return Math.round(Math.min(1, Math.max(0, value)) * 255)
		.toString(16)
		.padStart(2, '0')
}

/** A colour, 0 to 1 per channel, as `#RRGGBB`. */
function hex([red, green, blue]: readonly number[]): string {
	return `#${channel(red)}${channel(green)}${channel(blue)}`
}

/**
 * The tile's colours: a Material 3 tonal palette seeded from its gradient's
 * outer colour, so Menus stays green and Balances orange, but as one flat
 * container colour with its on-container colour for the symbol, in the
 * scheme the app is drawn in, rather than an iOS gradient.
 */
function useTileColors(view: ViewType): {container: string; onContainer: string} {
	let dark = useColorScheme() === 'dark'
	let outer = view.gradient[1]
	return React.useMemo(() => {
		let seedColor = hex(displayP3Components(outer))
		let colors = getMaterialColors({scheme: dark ? 'dark' : 'light', seedColor})
		return {container: colors.primaryContainer, onContainer: colors.onPrimaryContainer}
	}, [outer, dark])
}

/** What TalkBack says for a tile: its title, and that it leaves the app when it does. */
function tileDescription(view: ViewType): string {
	return opensInBrowser(view) ? `${view.title}, opens in a browser` : view.title
}

/**
 * A Home tile on Android, drawn in Material 3 rather than as iOS's gradient
 * cards, in the style Customize sets:
 *
 * - `shapes`: the tile's symbol inside a Material 3 Expressive shape filled
 *   with its colour, its title beneath.
 * - `cards`: a tonal card holding the symbol in a circle of its colour, over
 *   its title, as Quick Settings tints a tile's icon.
 */
export function MaterialHomeTile({view, index, tileStyle, onPress}: Props): React.ReactNode {
	let tile = useTileColors(view)
	let palette = useMaterialColors()
	let description = tileDescription(view)
	let symbol = symbolSource(view.icon)

	if (tileStyle === 'cards') {
		return (
			<Column
				modifiers={[
					fillMaxWidth(),
					defaultMinSize({minHeight: CARD_MIN_HEIGHT}),
					clip(Shapes.RoundedCorner(CARD_RADIUS)),
					background(palette.surfaceContainer),
					clickable(onPress),
					semantics({contentDescription: description}),
					paddingAll(CARD_PADDING),
				]}
				verticalArrangement="spaceBetween"
			>
				<Box
					contentAlignment="center"
					modifiers={[
						size(CARD_ICON_BOX, CARD_ICON_BOX),
						clip(Shapes.Circle),
						background(tile.container),
					]}
				>
					<Icon size={CARD_ICON_SIZE} source={symbol} tint={tile.onContainer} />
				</Box>
				<Text color={palette.onSurface} style={{typography: 'titleMedium'}}>
					{sentenceCase(view.title)}
				</Text>
			</Column>
		)
	}

	return (
		<Column
			horizontalAlignment="center"
			modifiers={[fillMaxWidth(), clickable(onPress), semantics({contentDescription: description})]}
			verticalArrangement={{spacedBy: 8}}
		>
			<Box
				contentAlignment="center"
				modifiers={[
					size(SHAPE_SIZE, SHAPE_SIZE),
					clip(SHAPES[index % SHAPES.length]),
					background(tile.container),
				]}
			>
				<Icon size={SHAPE_ICON_SIZE} source={symbol} tint={tile.onContainer} />
			</Box>
			<Text
				color={palette.onSurface}
				maxLines={2}
				minLines={2}
				style={{typography: 'labelLarge', textAlign: 'center'}}
			>
				{sentenceCase(view.title)}
			</Text>
		</Column>
	)
}
