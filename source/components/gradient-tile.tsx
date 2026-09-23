import * as React from 'react'
import {useColorScheme} from 'react-native'
import {Button, Image, RoundedRectangle, Text, VStack, ZStack} from '@expo/ui/swift-ui'
import {
	accessibilityLabel,
	aspectRatio,
	background,
	buttonStyle,
	contentShape,
	environment,
	font,
	foregroundStyle,
	frame,
	lineLimit,
	monospacedDigit,
	multilineTextAlignment,
	opacity,
	padding,
	shadow,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import type {SFSymbol} from 'sf-symbols-typescript'
import * as c from '@frogpond/colors'
import {displayP3, type Gradient} from '@frogpond/colors'
import {FILL_WIDTH, TILE_ASPECT} from './tile-layout'

/// SwiftUI's own disabled look for a plain button, measured on the simulator:
/// the whole tile, card and label alike, at half opacity. A dimmed tile wears
/// it without being disabled, so it can still be opened.
const DIMMED_OPACITY = 0.5

/// A neutral capsule rather than a red one, which would read as unread.
const COUNT_MODIFIERS = [
	font({textStyle: 'caption', weight: 'semibold'}),
	monospacedDigit(),
	foregroundStyle(c.label),
	padding({horizontal: 7, vertical: 2}),
	background(c.secondarySystemBackground, shapes.capsule()),
	padding({top: 8, trailing: 8}),
]

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
	/** How many things the tile holds, drawn at the card's top-right corner. None at zero. */
	count?: number
	/** How VoiceOver says the count, as "13 postings"; the bare number otherwise. */
	countLabel?: (count: number) => string
	/** Drawn as SwiftUI draws a disabled button, but still tappable, as for an area with nothing in it. */
	dimmed?: boolean
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
	count,
	countLabel = String,
	dimmed = false,
}: Props): React.ReactNode {
	let isDarkScheme = useColorScheme() === 'dark'
	let shownCount = count !== undefined && count > 0 ? count : undefined
	let label = shownCount === undefined ? title : `${title}, ${countLabel(shownCount)}`

	return (
		<Button
			modifiers={[
				buttonStyle('plain'),
				accessibilityLabel(label),
				...(dimmed ? [opacity(DIMMED_OPACITY)] : []),
			]}
			onPress={onPress}
		>
			<VStack modifiers={[contentShape(shapes.rectangle())]} spacing={LABEL_GAP}>
				{/* The count sits in the card's corner, over the centred icon, as
				    a Home Screen badge sits on an app icon. */}
				<ZStack
					alignment="topTrailing"
					modifiers={[frame({maxWidth: FILL_WIDTH}), aspectRatio({ratio, contentMode: 'fit'})]}
				>
					<ZStack modifiers={[frame({maxWidth: FILL_WIDTH, maxHeight: FILL_WIDTH})]}>
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

					{shownCount !== undefined ? (
						<Text modifiers={COUNT_MODIFIERS}>{String(shownCount)}</Text>
					) : null}
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
