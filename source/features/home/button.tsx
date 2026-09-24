import * as React from 'react'
import {useColorScheme, useWindowDimensions} from 'react-native'
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
import {FILL_WIDTH} from '../../components/tile-layout'

type Props = {
	view: ViewType
	onPress: () => void
}

function HomeScreenButtonLabel({
	title,
	icon,
	isDarkScheme,
}: {
	title: string
	icon: NonNullable<ImageProps['systemName']>
	isDarkScheme: boolean
}) {
	let {fontScale} = useWindowDimensions()

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
					// A fixed box, as Health's is, so glyphs of different heights
					// still give every card one height. It was measured at the
					// default text size, and the glyph grows with Dynamic Type, so
					// the box grows too or the glyph spills over the card's top.
					frame({height: (86 / 3) * fontScale}),
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
