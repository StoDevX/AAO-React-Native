import * as React from 'react'
import {Button, HStack, Image, Spacer, Text, VStack} from '@expo/ui/swift-ui'
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
				buttonStyle('plain'),
				accessibilityIdentifier(`${FOOD_ROW_PREFIX}${data.label}`),
				// The dietary icons and the specials star are unlabelled images, so
				// the row has to say what they mean or the information is sighted-only.
				accessibilityLabel(foodRowLabel(data, corIcons, allKeys)),
			]}
			onPress={onPress}
		>
			{/* contentShape belongs on the label, not the Button: SwiftUI derives the
			    tappable region from the label, so the Spacer -- most of the row --
			    is otherwise dead to taps. */}
			<HStack modifiers={[contentShape(shapes.rectangle())]} spacing={8}>
				{badgeSpecials && data.special ? (
					<Image
						modifiers={[font({textStyle: 'footnote'}), foregroundStyle(c.secondaryLabel)]}
						systemName="star.fill"
					/>
				) : null}

				<VStack alignment="leading" spacing={2}>
					{/* No colour override: a List row already draws its label in
					    the label colour, and restating it fights the system. */}
					<Text>{data.label}</Text>
					{data.description ? (
						<Text modifiers={[font({textStyle: 'footnote'}), foregroundStyle(c.secondaryLabel)]}>
							{data.description}
						</Text>
					) : null}
				</VStack>

				<Spacer />

				{iconKeys.length > 0 ? (
					<HStack spacing={ICON_GAP}>
						{iconKeys.map((key) => (
							/* `resizable` first, and not optional: without it SwiftUI draws
							   the image at its intrinsic pixel size and overflows the frame,
							   which had the icons colliding and running off the edge. */
							<Image
								key={key}
								modifiers={[
									resizable(),
									aspectRatio({contentMode: 'fit'}),
									frame({width: ICON_SIDE, height: ICON_SIDE}),
								]}
								uiImage={localIcons[key]}
							/>
						))}
					</HStack>
				) : null}
			</HStack>
		</Button>
	)
}
