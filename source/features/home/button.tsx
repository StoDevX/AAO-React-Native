import * as React from 'react'
import {useColorScheme, useWindowDimensions} from 'react-native'
import {Button, Image, Text, VStack, ZStack} from '@expo/ui/swift-ui'
import {
	accessibilityHint,
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
import {iconImage, opensInBrowser, type SymbolName, type ViewType} from '../views'
import {GradientRoundedRectangle} from '../../components/gradient-tile'
import {FILL_WIDTH} from '../../components/tile-layout'

type Props = {
	view: ViewType
	onPress: () => void
	/** What VoiceOver reads, where the title alone is ambiguous; the title otherwise. */
	label?: string
	/**
	 * The card's width. A `Grid` sizes a column to its widest card, so a long
	 * title would push the row past the screen's edge, and a lone card in a
	 * group would fill the row.
	 */
	width: number
}

function HomeScreenButtonLabel({
	title,
	icon,
	titleDesign,
	isDarkScheme,
}: {
	title: string
	icon: SymbolName
	titleDesign?: 'serif'
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
				{...iconImage(icon)}
			/>

			<Text
				modifiers={[
					font({textStyle: 'headline', weight: 'semibold', design: titleDesign}),
					foregroundStyle({type: 'hierarchical', style: 'primary'}),
				]}
			>
				{title}
			</Text>
		</VStack>
	)
}

export function HomeScreenButton({view, onPress, label, width}: Props): React.ReactNode {
	let isDarkScheme = useColorScheme() === 'dark'

	return (
		<Button
			modifiers={[
				buttonStyle('plain'),
				// make a card grow to match a taller one beside it
				frame({width, maxHeight: FILL_WIDTH}),
				accessibilityLabel(label ?? view.title),
				...(opensInBrowser(view) ? [accessibilityHint('Opens in a browser')] : []),
			]}
			onPress={onPress}
		>
			<ZStack alignment="topLeading">
				<GradientRoundedRectangle gradient={view.gradient} showShadow={isDarkScheme} />
				<HomeScreenButtonLabel
					title={view.title}
					icon={view.icon}
					titleDesign={view.titleDesign}
					isDarkScheme={isDarkScheme}
				/>
			</ZStack>
		</Button>
	)
}
