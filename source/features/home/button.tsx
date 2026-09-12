import * as React from 'react'
import { PlatformColor, useColorScheme } from 'react-native'
import { Button, Image, RoundedRectangle, Text, VStack, ZStack } from '@expo/ui/swift-ui'
import {
	accessibilityLabel,
	buttonStyle,
	font,
	foregroundStyle,
	frame,
	imageScale,
	padding,
	shadow,
} from '@expo/ui/swift-ui/modifiers'
import { displayP3 } from '@frogpond/colors'
import type { ViewType } from '../views'
import {
	homescreenIconDark,
	homescreenIconLight,
	homescreenTitleDark,
	homescreenTitleLight,
} from './colors'

type Props = {
	view: ViewType
	onPress: () => void
}

/// Gap between cards, both within a column and between the two columns.
export const CELL_MARGIN = 10

/// Gap between the screen edge and the cards.
export const SCREEN_MARGIN = 16

/// SwiftUI has no "fill the available width" constant reachable from JS, so we
/// cap the frame at a width no phone reaches and let the stack divide the space.
export const FILL_WIDTH = 10_000

function HomeScreenGradient({ view, isDarkScheme }: { view: ViewType; isDarkScheme: boolean }) {
	let [gradientInner, gradientOuter] = view.gradient
	return (
		<RoundedRectangle
			cornerRadius={27}
			modifiers={[
				shadow({
					// Only show shadow in light mode.
					color: isDarkScheme ? PlatformColor('transparent') : displayP3(gradientOuter, 0.4),
					radius: 8,
					y: 2,
				}),
				foregroundStyle({
					type: 'radialGradient',
					colors: [displayP3(gradientInner), displayP3(gradientOuter)],
					center: { x: 0.5, y: 0 },
					startRadius: 0,
					// TODO: eventually, we want to compute this radius size to match Health/Shortcuts
					endRadius: 129,
				}),
			]}
		/>
	)
}

function HomeScreenButtonLabel({ view, isDarkScheme }: { view: ViewType; isDarkScheme: boolean }) {
	let titleColor = isDarkScheme ? homescreenTitleDark : homescreenTitleLight
	let iconColor = isDarkScheme ? homescreenIconDark : homescreenIconLight
	return (
		<VStack
			alignment="leading"
			modifiers={[padding({ top: 56 / 3, bottom: 49.5 / 3, horizontal: 16 })]}
			spacing={10}
		>
			<Image
				modifiers={[
					frame({ height: 86 / 3 }),
					imageScale('large'),
					font({ textStyle: 'title3' }),
					foregroundStyle(iconColor),
				]}
				systemName={view.icon}
			/>

			<Text
				modifiers={[font({ textStyle: 'headline', weight: 'semibold' }), foregroundStyle(titleColor)]}
			>
				{view.title}
			</Text>
		</VStack>
	)
}

export function HomeScreenButton({ view, onPress }: Props): React.ReactNode {
	let isDarkScheme = useColorScheme() === 'dark'

	return (
		<Button
			modifiers={[
				buttonStyle('plain'),
				// make a card grow to match a taller one beside it
				frame({ maxWidth: FILL_WIDTH, maxHeight: FILL_WIDTH }),
				accessibilityLabel(view.title),
			]}
			onPress={onPress}
		>
			<ZStack alignment="topLeading">
				<HomeScreenGradient view={view} isDarkScheme={isDarkScheme} />
				<HomeScreenButtonLabel view={view} isDarkScheme={isDarkScheme} />
			</ZStack>
		</Button>
	)
}
