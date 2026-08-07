import * as React from 'react'
import {useColorScheme} from 'react-native'
import {
	Button,
	RoundedRectangle,
	Spacer,
	Text,
	VStack,
	ZStack,
} from '@expo/ui/swift-ui'
import {
	accessibilityLabel,
	aspectRatio,
	buttonStyle,
	contentShape,
	font,
	foregroundColor,
	foregroundStyle,
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

/// Matched from the Apple Health category-card screenshot: a 525x346px
/// (3x) card is a ~1.517:1 width:height ratio, with a corner radius of
/// roughly 23% of the card's height (~80px at 3x, on a 346px-tall card).
/// The radius is expressed as a point value tuned for a typical two-column
/// card width on a standard iPhone, since @expo/ui has no way to compute a
/// modifier value from the runtime-resolved card size.
const CELL_ASPECT_RATIO = 1.517
const CELL_RADIUS = 27
const cellPadding = 16

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
	let scheme = useColorScheme()
	let foreground =
		scheme === 'dark' ? homescreenForegroundDark : homescreenForegroundLight
	let glyph = entypoGlyph(view.icon)
	let [gradientTop, gradientBottom] = view.gradient

	return (
		<Button
			modifiers={[
				buttonStyle('plain'),
				frame({maxWidth: FILL_WIDTH}),
				aspectRatio({ratio: CELL_ASPECT_RATIO, contentMode: 'fit'}),
				accessibilityLabel(view.title),
			]}
			onPress={onPress}
		>
			{/* The fill, size and hit shape belong on the label, not the Button:
			    SwiftUI derives a button's tappable region from its label, so
			    putting contentShape on the Button leaves only the icon and title
			    tappable rather than the whole tile. */}
			<ZStack
				alignment="topLeading"
				modifiers={[
					contentShape(
						shapes.roundedRectangle({
							cornerRadius: CELL_RADIUS,
							roundedCornerStyle: 'continuous',
						}),
					),
				]}
			>
				<RoundedRectangle
					cornerRadius={CELL_RADIUS}
					modifiers={[
						foregroundStyle({
							type: 'linearGradient',
							colors: [gradientTop, gradientBottom],
							startPoint: {x: 0.5, y: 0},
							endPoint: {x: 0.5, y: 1},
						}),
					]}
				/>
				<VStack
					alignment="leading"
					modifiers={[padding({all: cellPadding})]}
					spacing={4}
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
					<Spacer />
					<Text
						modifiers={[
							font({textStyle: TITLE_TEXT_STYLE}),
							foregroundColor(foreground),
						]}
					>
						{view.title}
					</Text>
				</VStack>
			</ZStack>
		</Button>
	)
}
