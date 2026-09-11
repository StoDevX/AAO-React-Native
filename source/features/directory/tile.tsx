import * as React from 'react'
import {useColorScheme} from 'react-native'
import {Button, Image, RoundedRectangle, Text, VStack, ZStack} from '@expo/ui/swift-ui'
import {
	accessibilityLabel,
	aspectRatio,
	buttonStyle,
	contentShape,
	font,
	foregroundStyle,
	frame,
	lineLimit,
	multilineTextAlignment,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import type {SFSymbol} from 'sf-symbols-typescript'
import * as c from '@frogpond/colors'
import {FILL_WIDTH} from '../home/button'
import {homescreenIconDark, homescreenIconLight} from '../home/colors'
import {TILE_ASPECT, TILE_RADIUS} from '../../components/tile-layout'
import type {ContactType} from './types'

/// The gradient starts at the top edge's centre and has to reach the two
/// bottom corners, hypot(109 / 2, 167) ~= 176pt away on that card. Same
/// construction as the home cards; features/home/button.tsx explains it.
const TILE_GRADIENT_RADIUS = 176
/// The glyph sized against the card rather than in points, so it grows with
/// Dynamic Type. `Image`'s `size` prop is ignored when a `font` modifier
/// carries a `textStyle`.
const ICON_TEXT_STYLE = 'largeTitle'
/// Space between the card and the name beneath it.
const LABEL_GAP = 8
/// Two lines, with an ellipsis for whatever still doesn't fit, rather than
/// one: most titles read better wrapped than clipped at this width. The
/// `Grid`'s `alignment="top"` is what keeps a one-line tile's card level with
/// a two-line neighbour's -- without it every card centres in its row and a
/// shorter label pulls its card down to match the tallest one beside it.
const LABEL_LINES = 2

/// Drawn when a contact names no icon. A named icon this iOS does not carry
/// draws nothing instead -- `Image(systemName:)` validates nothing and just
/// renders empty, so this fallback never reaches that case.
const FALLBACK_ICON: SFSymbol = 'phone.fill'

type Props = {
	contact: ContactType
	/** Opens the contact's detail screen. */
	onPress: () => void
}

/**
 * One curated campus contact, in the shape of a Phone.app favorite: a portrait
 * gradient card carrying a single SF Symbol, with the name beneath it.
 *
 * Tapping opens the detail screen, where the contact's call/link action lives.
 * There is no long-press menu: SwiftUI hoists a `.contextMenu` from a `List`
 * row's content to the whole row, and the landing renders this grid as one row
 * of an inset-grouped list, so a per-tile menu would lift the entire grid.
 */
export function ContactTile({contact, onPress}: Props): React.ReactNode {
	let dark = useColorScheme() === 'dark'
	let iconColor = dark ? homescreenIconDark : homescreenIconLight
	let [inner, outer] = c.resolveGradient(contact.gradient)

	return (
		<Button modifiers={[buttonStyle('plain'), accessibilityLabel(contact.title)]} onPress={onPress}>
			{/* The hit shape belongs on the label, not the Button: SwiftUI
			    derives a button's tappable region from its label, and without
			    a content shape only the drawn glyph and text hit-test -- the
			    gradient and the gap between card and name do not.
			    features/home/button.tsx carries the same note. */}
			<VStack modifiers={[contentShape(shapes.rectangle())]} spacing={LABEL_GAP}>
				{/* maxWidth first: the ratio only decides the height once the
				    card has taken the column's full width. */}
				<ZStack
					modifiers={[
						frame({maxWidth: FILL_WIDTH}),
						aspectRatio({ratio: TILE_ASPECT, contentMode: 'fit'}),
					]}
				>
					<RoundedRectangle
						cornerRadius={TILE_RADIUS}
						modifiers={[
							foregroundStyle({
								type: 'radialGradient',
								colors: [c.displayP3(inner), c.displayP3(outer)],
								center: {x: 0.5, y: 0},
								startRadius: 0,
								endRadius: TILE_GRADIENT_RADIUS,
							}),
						]}
					/>
					<Image
						color={iconColor}
						modifiers={[font({textStyle: ICON_TEXT_STYLE})]}
						systemName={contact.icon ?? FALLBACK_ICON}
					/>
				</ZStack>

				<Text
					modifiers={[
						font({textStyle: 'subheadline'}),
						foregroundStyle(c.secondaryLabel),
						multilineTextAlignment('center'),
						lineLimit(LABEL_LINES),
						frame({maxWidth: FILL_WIDTH}),
					]}
				>
					{contact.title}
				</Text>
			</VStack>
		</Button>
	)
}
