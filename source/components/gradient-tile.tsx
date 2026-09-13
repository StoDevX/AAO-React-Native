import * as React from 'react'
import {useColorScheme} from 'react-native'
import {Button, Image, RoundedRectangle, Text, VStack, ZStack} from '@expo/ui/swift-ui'
import {
	accessibilityLabel,
	aspectRatio,
	buttonStyle,
	contentShape,
	environment,
	font,
	foregroundStyle,
	frame,
	lineLimit,
	multilineTextAlignment,
	opacity,
	shadow,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import type {SFSymbol} from 'sf-symbols-typescript'
import {displayP3, type Gradient} from '@frogpond/colors'
import {FILL_WIDTH} from '../features/home/button'
import {TILE_ASPECT} from './tile-layout'

/// Space between the card and the name beneath it.
const LABEL_GAP = 8
/// Two lines, with an ellipsis for whatever still doesn't fit, rather than
/// one: most titles read better wrapped than clipped at this width. The
/// `Grid`'s `alignment="top"` is what keeps a one-line tile's card level with
/// a two-line neighbour's -- without it every card centres in its row and a
/// shorter label pulls its card down to match the tallest one beside it.
const LABEL_LINES = 2

type Props = {
	title: string
	icon: SFSymbol
	gradient: Gradient
	/** Overrides the default portrait ratio (`TILE_ASPECT`) -- pass 1 for a square tile. */
	ratio?: number
	/** Opens whatever this tile represents. */
	onPress: () => void
}

export function GradientRoundedRectangle({
	gradient,
	showShadow,
}: {
	gradient: Gradient
	showShadow: boolean
}): React.ReactNode {
	let [start, end] = gradient

	return (
		<RoundedRectangle
			cornerRadius={27}
			modifiers={[
				showShadow
					? shadow({
							color: displayP3(end, 0.4),
							radius: 8,
							y: 2,
						})
					: {$type: 'empty'},
				foregroundStyle({
					type: 'radialGradient',
					colors: [displayP3(start), displayP3(end)],
					center: {x: 0.5, y: 0},
					startRadius: 0,
					// TODO: eventually, we want to compute this radius size to match Health/Shortcuts
					endRadius: 129,
				}),
			]}
		/>
	)
}

/**
 * One card in the shape of a Phone.app favorite: a portrait gradient card
 * carrying a single SF Symbol, with a label beneath it. Shared between
 * Directory's curated contacts and Student Orgs' categories -- same visual
 * language, different data behind it.
 *
 * There is no long-press menu: SwiftUI hoists a `.contextMenu` from a
 * `List` row's content to the whole row, and every screen this renders in
 * puts the grid inside one row of an inset-grouped list, so a per-tile menu
 * would lift the entire grid.
 */
export function GradientTile({
	title,
	icon,
	gradient,
	ratio = TILE_ASPECT,
	onPress,
}: Props): React.ReactNode {
	let isDarkScheme = useColorScheme() === 'dark'

	return (
		<Button modifiers={[buttonStyle('plain'), accessibilityLabel(title)]} onPress={onPress}>
			<VStack modifiers={[contentShape(shapes.rectangle())]} spacing={LABEL_GAP}>
				<ZStack
					modifiers={[frame({maxWidth: FILL_WIDTH}), aspectRatio({ratio, contentMode: 'fit'})]}
				>
					<GradientRoundedRectangle gradient={gradient} showShadow={isDarkScheme} />

					<Image
						modifiers={[
							// force the colors of the Image here to be inverted from typical expectations
							environment({key: 'colorScheme', value: isDarkScheme ? 'light' : 'dark'}),
							font({textStyle: 'largeTitle'}),
							foregroundStyle({type: 'hierarchical', style: 'primary'}),
							opacity(0.8),
						]}
						systemName={icon}
					/>
				</ZStack>

				<Text
					modifiers={[
						font({textStyle: 'subheadline'}),
						foregroundStyle({type: 'hierarchical', style: 'secondary'}),
						multilineTextAlignment('center'),
						lineLimit(LABEL_LINES),
						frame({maxWidth: FILL_WIDTH}),
					]}
				>
					{title}
				</Text>
			</VStack>
		</Button>
	)
}
