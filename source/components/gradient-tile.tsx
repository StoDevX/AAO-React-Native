import * as React from 'react'
import {useColorScheme} from 'react-native'
import {Button, Image, RoundedRectangle, Text, VStack, ZStack} from '@expo/ui/swift-ui'
import {
	accessibilityHint,
	accessibilityInputLabels,
	accessibilityLabel,
	aspectRatio,
	background,
	buttonStyle,
	contentShape,
	environment,
	fixedSize,
	font,
	foregroundStyle,
	frame,
	lineLimit,
	monospacedDigit,
	multilineTextAlignment,
	opacity,
	padding,
	resizable,
	shadow,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {displayP3, type Gradient} from '@frogpond/colors'
import {iconImage, type SymbolName} from '../features/views'
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

/// Every symbol is fitted into a square this fraction of the card's width, so
/// a wide one (a credit card) and a tall one (a fork and knife) read as the
/// same weight, and the icons grow with the card at larger text sizes.
const ICON_FRACTION = 0.44
/// The square's side on a card whose width the grid decides.
const DEFAULT_ICON_SIZE = 36

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
	/**
	 * The full name VoiceOver reads, when `title` is a shortened one -- "Jobs"
	 * on the tile, "Student Work" aloud. Voice Control answers to either.
	 */
	spokenTitle?: string
	icon: SymbolName
	gradient: Gradient
	/** Fixes the tile's width in points; without it the tile takes whatever its grid column offers. */
	width?: number
	/** Overrides the default portrait ratio (`TILE_ASPECT`) -- pass 1 for a square tile. */
	ratio?: number
	/** What VoiceOver says after the name, when the name alone leaves out where the tile goes. */
	hint?: string
	/** Opens whatever this tile represents. */
	onPress: () => void
	/** How many things the tile holds, drawn at the card's top-right corner. None at zero. */
	count?: number
	/** How VoiceOver says the count, as "13 postings" or "no postings"; the bare number otherwise. */
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
 * carrying a single SF Symbol, with a label beneath it. Shared between home,
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
	spokenTitle = title,
	icon,
	gradient,
	width,
	ratio = TILE_ASPECT,
	hint,
	onPress,
	count,
	countLabel = String,
	dimmed = false,
}: Props): React.ReactNode {
	let isDarkScheme = useColorScheme() === 'dark'
	let iconSize = width === undefined ? DEFAULT_ICON_SIZE : Math.round(width * ICON_FRACTION)
	let widthModifier = frame(width === undefined ? {maxWidth: FILL_WIDTH} : {width})
	// A fixed width fixes the card's height too: an aspect ratio alone lets the
	// card grow taller when its grid row does, as a row beside an empty slot can.
	let cardModifiers =
		width === undefined
			? [widthModifier, aspectRatio({ratio, contentMode: 'fit'})]
			: [frame({width, height: width / ratio})]
	let shownCount = count !== undefined && count > 0 ? count : undefined
	// A known count is spoken even at zero: a dimmed tile is not disabled, so
	// the label is all that tells VoiceOver an empty area from a loading one.
	let label = count === undefined ? spokenTitle : `${spokenTitle}, ${countLabel(count)}`

	return (
		<Button
			modifiers={[
				buttonStyle('plain'),
				accessibilityLabel(label),
				...(hint === undefined ? [] : [accessibilityHint(hint)]),
				...(spokenTitle === title ? [] : [accessibilityInputLabels([title, spokenTitle])]),
				...(dimmed ? [opacity(DIMMED_OPACITY)] : []),
			]}
			onPress={onPress}
		>
			{/* fixedSize keeps the tile at its own full height. Without it, a
			    row mixing one-line and two-line names is offered less height
			    than a two-line tile needs -- 11pt short at xSmall -- and the
			    card, being the one flexible part, shrinks to absorb it. */}
			<VStack
				modifiers={[
					contentShape(shapes.rectangle()),
					fixedSize({horizontal: false, vertical: true}),
					...(width === undefined ? [] : [frame({width})]),
				]}
				spacing={LABEL_GAP}
			>
				{/* The count sits in the card's corner, over the centred icon, as
				    a Home Screen badge sits on an app icon. */}
				<ZStack alignment="topTrailing" modifiers={cardModifiers}>
					<ZStack modifiers={[frame({maxWidth: FILL_WIDTH, maxHeight: FILL_WIDTH})]}>
						<GradientRoundedRectangle gradient={gradient} showShadow={isDarkScheme} />

						<Image
							modifiers={[
								// force the colors of the Image here to be inverted from typical expectations
								environment({key: 'colorScheme', value: isDarkScheme ? 'light' : 'dark'}),
								resizable(),
								aspectRatio({contentMode: 'fit'}),
								frame({width: iconSize, height: iconSize}),
								foregroundStyle({type: 'hierarchical', style: 'primary'}),
								opacity(0.8),
							]}
							{...iconImage(icon)}
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
