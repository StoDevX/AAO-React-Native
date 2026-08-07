import * as React from 'react'
import {useColorScheme} from 'react-native'
import {
	Button,
	Image,
	RoundedRectangle,
	Text,
	VStack,
	ZStack,
} from '@expo/ui/swift-ui'
import {
	accessibilityLabel,
	buttonStyle,
	contentShape,
	font,
	foregroundColor,
	foregroundStyle,
	frame,
	padding,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import type {ViewType} from '../views'
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
/// Health's grid uses a wider margin at the screen edge than between cards
/// (measured: 16pt outer vs. 10pt between cards).
export const SCREEN_MARGIN = 16

/// Health's category cards size to content, not a fixed aspect ratio --
/// single-line titles (e.g. "Cycle Tracking", ~94pt tall) render noticeably
/// shorter than two-line ones ("Body Measurements", ~115pt tall). Measured
/// corner-inset profiles are identical between the two, confirming Health
/// uses one fixed corner radius (~27pt) regardless of card height, not one
/// proportional to it.
const CELL_RADIUS = 27
/// Shortcuts' cards fade from a bright point at the top edge's centre out to
/// their far corners, so the gradient has to reach the two bottom ones: on a
/// 393pt screen the card is 175.5 x 94pt, which puts them
/// hypot(175.5 / 2, 94) ~= 129pt away. It's a constant rather than a measured
/// size because the alternative is plumbing the rendered card's bounds back out
/// to JS, and a few points either way only shifts where the fade bottoms out.
const CELL_GRADIENT_RADIUS = 129
const cellPadding = 16
/// The vertical insets are not symmetric with the horizontal one, nor with each
/// other. Both are written as whole pixels at 3x because that is how they were
/// measured, against Health's own "Heart" card on the iPhone 14 Pro these
/// numbers describe.
///
/// The top inset is set by the title rather than the icon: the SF Symbol we can
/// render comes out two pixels shorter than Health's (see ICON_TEXT_STYLE), and
/// of the two the title is the one worth landing exactly. The bottom inset then
/// only has to bring the card's own height back to Health's.
const cellPaddingTop = 56 / 3
const cellPaddingBottom = 49.5 / 3
const cellIconTitleGap = 10

/// SwiftUI has no "fill the available width" constant reachable from JS, so we
/// cap the frame at a width no phone reaches and let the stack divide the space.
export const FILL_WIDTH = 10_000

/// Health scales its card icons with Dynamic Type: measured across three text
/// sizes its Heart glyph runs 72 -> 83 -> 106px while the title runs
/// 108 -> 129 -> 169px, so the icon is sized by a text style and not by a fixed
/// point size. @expo/ui ignores `Image`'s `size` prop whenever a `font` modifier
/// carries a `textStyle`, which leaves the built-in styles as the only scalable
/// sizes we can ask for.
///
/// `title` is the closest of them: it draws the glyph 82x75 against Health's
/// 83x77. A fixed 28.67pt size matches Health exactly at the default text size,
/// but is then 23px too small at 130%, so those two pixels buy a card that
/// tracks Health across the whole Dynamic Type range.
const ICON_TEXT_STYLE = 'title'
/// SF Symbols don't share a common height -- across Health's own cards the ink
/// runs from 77px for `heart.fill` to 104px for its mobility glyph -- so a card
/// that sizes to its icon comes out a different height for every view. Health
/// pins the icon into a fixed box instead and centres the glyph in it: measured
/// across six of its cards the ink heights vary by 27px while their centres all
/// land within a pixel and a half of each other, and every single-line card is
/// exactly 283px tall. 86px at 3x puts that centre where Health has it.
const ICON_BOX_HEIGHT = 86 / 3
/// 17pt semibold, which is what Health's card titles measure at every text size
/// captured.
///
/// Titles have to fit on one line. Health wraps to two and grows the card to
/// suit, but this version of @expo/ui's Text doesn't honor lineLimit(2) here
/// whatever frame and multilineTextAlignment modifiers it's given, so anything
/// too long truncates with an ellipsis instead. Every current title fits at the
/// default text size; a longer one added later will need shortening rather than
/// a smaller font, which would break the match with Health.
const TITLE_TEXT_STYLE = 'headline'

export function HomeScreenButton({view, onPress}: Props): React.ReactNode {
	let scheme = useColorScheme()
	let dark = scheme === 'dark'
	let titleColor = dark ? homescreenTitleDark : homescreenTitleLight
	let iconColor = dark ? homescreenIconDark : homescreenIconLight
	let [gradientInner, gradientOuter] = view.gradient

	return (
		<Button
			modifiers={[
				buttonStyle('plain'),
				// maxHeight as well as maxWidth: the row is an HStack, so this is what
				// makes a card grow to match a taller one beside it instead of
				// leaving a gap under itself.
				frame({maxWidth: FILL_WIDTH, maxHeight: FILL_WIDTH}),
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
							type: 'radialGradient',
							colors: [gradientInner, gradientOuter],
							center: {x: 0.5, y: 0},
							startRadius: 0,
							endRadius: CELL_GRADIENT_RADIUS,
						}),
					]}
				/>
				<VStack
					alignment="leading"
					modifiers={[
						padding({
							top: cellPaddingTop,
							bottom: cellPaddingBottom,
							horizontal: cellPadding,
						}),
					]}
					spacing={cellIconTitleGap}
				>
					<Image
						color={iconColor}
						modifiers={[
							font({textStyle: ICON_TEXT_STYLE}),
							frame({height: ICON_BOX_HEIGHT}),
						]}
						systemName={view.icon}
					/>
					<Text
						modifiers={[
							font({
								textStyle: TITLE_TEXT_STYLE,
								weight: 'semibold',
							}),
							foregroundColor(titleColor),
						]}
					>
						{view.title}
					</Text>
				</VStack>
			</ZStack>
		</Button>
	)
}
