import * as React from 'react'
import {useColorScheme} from 'react-native'
import {Button, Image, Text, VStack, ZStack, type ImageProps} from '@expo/ui/swift-ui'
import {
	accessibilityLabel,
	buttonStyle,
	environment,
	font,
	foregroundStyle,
	frame,
	imageScale,
	opacity,
	padding,
} from '@expo/ui/swift-ui/modifiers'
import type {ViewType} from '../views'
import {GradientRoundedRectangle} from '../../components/gradient-tile'

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

function HomeScreenButtonLabel({
	title,
	icon,
	isDarkScheme,
}: {
	title: string
	icon: NonNullable<ImageProps['systemName']>
	isDarkScheme: boolean
}) {
	return (
		<VStack
			alignment="leading"
			modifiers={[
				padding({top: 56 / 3, bottom: 49.5 / 3, horizontal: 16}),
				// force the colors of the Image and Text below here to be inverted from typical expectations
				environment({key: 'colorScheme', value: isDarkScheme ? 'light' : 'dark'}),
			]}
			spacing={10}
		>
			<Image
				modifiers={[
					frame({height: 86 / 3}),
					imageScale('large'),
					font({textStyle: 'title3'}),
					foregroundStyle({type: 'hierarchical', style: 'primary'}),
					opacity(0.8),
				]}
				systemName={icon}
			/>

			<Text
				modifiers={[
					font({textStyle: 'headline', weight: 'semibold'}),
					foregroundStyle({type: 'hierarchical', style: 'primary'}),
				]}
			>
				{title}
			</Text>
		</VStack>
	)
}

export function HomeScreenButton({view, onPress}: Props): React.ReactNode {
	let isDarkScheme = useColorScheme() === 'dark'

	return (
		<Button
			modifiers={[
				buttonStyle('plain'),
				// make a card grow to match a taller one beside it
				frame({maxWidth: FILL_WIDTH, maxHeight: FILL_WIDTH}),
				accessibilityLabel(view.title),
			]}
			onPress={onPress}
		>
			<ZStack alignment="topLeading">
				<GradientRoundedRectangle gradient={view.gradient} showShadow={isDarkScheme} />
				<HomeScreenButtonLabel title={view.title} icon={view.icon} isDarkScheme={isDarkScheme} />
			</ZStack>
		</Button>
	)
}
