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
// SwiftUI's .system(size:) is fixed; pairing a size with a text style makes the
// font scale with Dynamic Type the way the React Native Text it replaced did.
//
// For the icon the family is a custom font, so this maps to
// Font.custom(_:size:relativeTo:) and ICON_SIZE governs the rendered size. For
// the title there is no family, so the text style's own size wins --
// subheadline is 15pt. There is deliberately no title size constant: passing
// one alongside a text style has no effect, so it would only mislead.
const ICON_TEXT_STYLE = 'title'
const TITLE_TEXT_STYLE = 'subheadline'

/// `layer.cornerRadius` on iOS defaults to circular corners, which is what the
/// React Native `borderRadius` produced.
const cellShape = shapes.roundedRectangle({
	cornerRadius: CELL_RADIUS,
	roundedCornerStyle: 'circular',
})

/// `view.icon` comes from the view data rather than from a literal, so a typo
/// or a rename upstream reaches this as an undefined lookup. Fail with a
/// message naming the icon instead of letting String.fromCodePoint throw a
/// RangeError that takes the whole home screen down with it.
function entypoGlyph(name: keyof typeof EntypoGlyphs): string {
	let codepoint: number | undefined = EntypoGlyphs[name]
	if (typeof codepoint !== 'number') {
		throw new Error(
			`Unknown Entypo icon "${String(name)}". It is not in the glyphmap at ` +
				'@react-native-vector-icons/entypo/glyphmaps/Entypo.json.',
		)
	}
	return String.fromCodePoint(codepoint)
}

export function HomeScreenButton({view, onPress}: Props): React.ReactNode {
	let foreground =
		view.foreground === 'light'
			? homescreenForegroundLight
			: homescreenForegroundDark
	let glyph = entypoGlyph(view.icon)

	return (
		<Button
			modifiers={[
				buttonStyle('plain'),
				frame({maxWidth: FILL_WIDTH}),
				accessibilityLabel(view.title),
			]}
			onPress={onPress}
		>
			{/* The fill, size and hit shape belong on the label, not the Button:
			    SwiftUI derives a button's tappable region from its label, so
			    putting contentShape on the Button leaves only the icon and title
			    tappable rather than the whole tile. */}
			<VStack
				modifiers={[
					padding({
						top: cellVerticalPadding,
						bottom: cellVerticalPadding / 2,
						horizontal: cellHorizontalPadding,
					}),
					frame({maxWidth: FILL_WIDTH}),
					background(view.tint, cellShape),
					contentShape(cellShape),
				]}
				spacing={0}
			>
				<Text
					modifiers={[
						font({
							family: ICON_FONT_FAMILY,
							size: ICON_SIZE,
							textStyle: ICON_TEXT_STYLE,
						}),
						foregroundColor(foreground),
					]}
				>
					{glyph}
				</Text>
				<Text
					modifiers={[
						font({textStyle: TITLE_TEXT_STYLE}),
						foregroundColor(foreground),
					]}
				>
					{view.title}
				</Text>
			</VStack>
		</Button>
	)
}
