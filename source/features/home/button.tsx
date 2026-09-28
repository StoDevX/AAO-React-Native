import * as React from 'react'
import {useColorScheme, useWindowDimensions} from 'react-native'
import {
	Button,
	HStack,
	Image,
	Spacer,
	Text,
	VStack,
	ZStack,
	type ImageProps,
} from '@expo/ui/swift-ui'
import {
	accessibilityHint,
	accessibilityLabel,
	background,
	buttonStyle,
	environment,
	font,
	foregroundStyle,
	frame,
	imageScale,
	opacity,
	padding,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import {opensInBrowser, type ViewType} from '../views'
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
	isWebLink,
}: {
	title: string
	icon: NonNullable<ImageProps['systemName']>
	isDarkScheme: boolean
	isWebLink: boolean
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
			<HStack>
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

				{isWebLink ? (
					<>
						<Spacer />
						<WebLinkBadge isDarkScheme={isDarkScheme} />
					</>
				) : null}
			</HStack>

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

/// The badge's diameter, in points.
const BADGE_SIZE = 26

/// Marks a tile that opens a web page rather than one of the app's own screens.
/// It sits in the icon's row, as a Shortcuts tile's run button does.
function WebLinkBadge({isDarkScheme}: {isDarkScheme: boolean}) {
	return (
		<Image
			modifiers={[
				font({textStyle: 'caption', weight: 'bold'}),
				foregroundStyle({type: 'hierarchical', style: 'primary'}),
				frame({width: BADGE_SIZE, height: BADGE_SIZE}),
				// a wash of the glyph's own colour, so the gradient shows through
				background(
					isDarkScheme ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.25)',
					shapes.circle(),
				),
			]}
			systemName="arrow.up.right"
		/>
	)
}

export function HomeScreenButton({view, onPress}: Props): React.ReactNode {
	let isDarkScheme = useColorScheme() === 'dark'
	let isWebLink = opensInBrowser(view)

	return (
		<Button
			modifiers={[
				buttonStyle('plain'),
				// make a card grow to match a taller one beside it
				frame({maxWidth: FILL_WIDTH, maxHeight: FILL_WIDTH}),
				accessibilityLabel(view.title),
				...(isWebLink ? [accessibilityHint('Opens in a browser')] : []),
			]}
			onPress={onPress}
		>
			<ZStack alignment="topLeading">
				<GradientRoundedRectangle
					gradient={view.gradient}
					outlined={isWebLink}
					showShadow={isDarkScheme}
				/>
				<HomeScreenButtonLabel
					icon={view.icon}
					isDarkScheme={isDarkScheme}
					isWebLink={isWebLink}
					title={view.title}
				/>
			</ZStack>
		</Button>
	)
}
