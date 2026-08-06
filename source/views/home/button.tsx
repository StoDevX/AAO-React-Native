import * as React from 'react'
import {Button, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityLabel,
	background,
	buttonStyle,
	contentShape,
	font,
	foregroundColor,
	frame,
	padding,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import EntypoGlyphs from '@react-native-vector-icons/entypo/glyphmaps/Entypo.json'
import type {ViewType} from '../views'
import {homescreenForegroundDark, homescreenForegroundLight} from './colors'

type Props = {
	view: ViewType
	onPress: () => void
}

export const CELL_MARGIN = 10
const CELL_RADIUS = 17
const cellVerticalPadding = 8
const cellHorizontalPadding = 4

/// SwiftUI has no "fill the available width" constant reachable from JS, so we
/// cap the frame at a width no phone reaches and let the stack divide the space.
export const FILL_WIDTH = 10_000

/// The Entypo glyphs come from the app-wide font registered through `UIAppFonts`
/// in Info.plist; SwiftUI addresses it by its family name.
const ICON_FONT_FAMILY = 'Entypo'
const ICON_SIZE = 32
const TITLE_SIZE = 14

/// `layer.cornerRadius` on iOS defaults to circular corners, which is what the
/// React Native `borderRadius` produced.
const cellShape = shapes.roundedRectangle({
	cornerRadius: CELL_RADIUS,
	roundedCornerStyle: 'circular',
})

export function HomeScreenButton({view, onPress}: Props): React.ReactNode {
	let foreground =
		view.foreground === 'light'
			? homescreenForegroundLight
			: homescreenForegroundDark
	let glyph = String.fromCodePoint(EntypoGlyphs[view.icon])

	return (
		<Button
			modifiers={[
				buttonStyle('plain'),
				frame({maxWidth: FILL_WIDTH}),
				background(view.tint, cellShape),
				contentShape(cellShape),
				accessibilityLabel(view.title),
			]}
			onPress={onPress}
		>
			<VStack
				modifiers={[
					padding({
						top: cellVerticalPadding,
						bottom: cellVerticalPadding / 2,
						horizontal: cellHorizontalPadding,
					}),
					frame({maxWidth: FILL_WIDTH}),
				]}
				spacing={0}
			>
				<Text
					modifiers={[
						font({family: ICON_FONT_FAMILY, size: ICON_SIZE}),
						foregroundColor(foreground),
					]}
				>
					{glyph}
				</Text>
				<Text
					modifiers={[font({size: TITLE_SIZE}), foregroundColor(foreground)]}
				>
					{view.title}
				</Text>
			</VStack>
		</Button>
	)
}
