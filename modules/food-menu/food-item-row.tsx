import * as React from 'react'
import {Button, HStack, Image, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityIdentifier,
	accessibilityLabel,
	aspectRatio,
	buttonStyle,
	contentShape,
	font,
	foregroundStyle,
	frame,
	resizable,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'

import {dietaryIconKeys} from './lib/dietary-icon-keys'
import {foodRowLabel} from './lib/food-row-label'
import type {MasterCorIconMapType, MenuItemType} from './types'

/** Matches the 15pt icons the previous React Native row drew. */
const ICON_SIDE = 15
const ICON_GAP = 6

/**
 * Every food row carries this prefix so XCUITest can query rows directly
 * instead of walking every button. Mirror it in `TestIdentifiers.Menus`.
 */
export const FOOD_ROW_PREFIX = 'food-row-'

/**
 * Built once, not per row.
 *
 * A long meal renders two hundred rows at a time -- Stav's lunch is 205 -- and
 * an inline `modifiers={[…]}` allocates a fresh array and fresh modifier
 * objects for every one of them. Only the accessibility modifiers stay inline,
 * because they carry the row's own text.
 */
const PLAIN_BUTTON = buttonStyle('plain')

/**
 * `contentShape` belongs on the label rather than the `Button`: SwiftUI derives
 * a button's tappable region from its label, so the run to the right of a short
 * dish name is otherwise dead to taps.
 */
const ROW_HIT_AREA = [contentShape(shapes.rectangle())]

/**
 * Fills the row so the icons settle against the trailing edge. A `Spacer` reads
 * more obviously but costs another view on every row, which at two hundred rows
 * is two hundred views for one alignment.
 */
const FILL_LEADING = [frame({maxWidth: Infinity, alignment: 'leading'})]

const SECONDARY_FOOTNOTE = [font({textStyle: 'footnote'}), foregroundStyle(c.secondaryLabel)]

/**
 * `resizable` first, and not optional: without it SwiftUI draws the image at
 * its intrinsic pixel size and overflows the frame, which had the icons
 * colliding with each other and running off the trailing edge.
 */
const ICON = [
	resizable(),
	aspectRatio({contentMode: 'fit'}),
	frame({width: ICON_SIDE, height: ICON_SIDE}),
]

type Props = {
	data: MenuItemType
	corIcons: MasterCorIconMapType
	localIcons: Record<string, string>
	badgeSpecials?: boolean
	onPress: () => void
}

export function FoodItemRow({
	data,
	corIcons,
	localIcons,
	badgeSpecials = true,
	onPress,
}: Props): React.ReactNode {
	// Only icons that actually downloaded get drawn, but the label names every
	// icon the item carries -- a VoiceOver user should hear "Gluten Free"
	// whether or not that particular PNG made it onto disk.
	let allKeys = dietaryIconKeys(corIcons, data.cor_icon)
	let iconKeys = allKeys.filter((key) => localIcons[key])

	return (
		<Button
			// Without `plain`, SwiftUI tints the whole label with the accent colour
			// and every dish name reads as a link. Same note as BuildingRow.
			modifiers={[
				PLAIN_BUTTON,
				accessibilityIdentifier(`${FOOD_ROW_PREFIX}${data.label}`),
				// The dietary icons and the specials star are unlabelled images, so
				// the row has to say what they mean or the information is sighted-only.
				accessibilityLabel(foodRowLabel(data, corIcons, allKeys)),
			]}
			onPress={onPress}
		>
			<HStack modifiers={ROW_HIT_AREA} spacing={8}>
				{badgeSpecials && data.special ? (
					<Image modifiers={SECONDARY_FOOTNOTE} systemName="star.fill" />
				) : null}

				{/* Hardly any dish carries a description -- five of Stav's two hundred
				    lunch items -- so the stack that pairs one with the name is built
				    only for the rows that actually have one. */}
				{data.description ? (
					<VStack alignment="leading" modifiers={FILL_LEADING} spacing={2}>
						{/* No colour override: a List row already draws its label in the
						    label colour, and restating it fights the system. */}
						<Text>{data.label}</Text>
						<Text modifiers={SECONDARY_FOOTNOTE}>{data.description}</Text>
					</VStack>
				) : (
					<Text modifiers={FILL_LEADING}>{data.label}</Text>
				)}

				{iconKeys.length > 0 ? (
					<HStack spacing={ICON_GAP}>
						{iconKeys.map((key) => (
							<Image key={key} modifiers={ICON} uiImage={localIcons[key]} />
						))}
					</HStack>
				) : null}
			</HStack>
		</Button>
	)
}
