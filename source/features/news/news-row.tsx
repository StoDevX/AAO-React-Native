import * as React from 'react'
import {Alert, Image, StyleSheet, type ImageResolvedAssetSource} from 'react-native'
import {Button, HStack, Image as SwiftUIImage, RNHostView, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityHidden,
	accessibilityIdentifier,
	accessibilityLabel,
	alignmentGuide,
	buttonStyle,
	contentShape,
	foregroundStyle,
	frame,
	lineLimit,
	listRowBackground,
	padding,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import type {StoryType} from './types'

/**
 * Every news row carries this prefix so XCUITest can query rows directly
 * instead of walking every button.
 */
export const NEWS_ROW_PREFIX = 'news-row-'

/** Built once, not per row -- the same reasoning as `FoodItemRow`'s `PLAIN_BUTTON`. */
const PLAIN_BUTTON = buttonStyle('plain')

/**
 * `contentShape` belongs on the label rather than the `Button`: SwiftUI
 * derives a button's tappable region from its label, so the space to the
 * right of a short title -- and the chevron's own padding -- would
 * otherwise be dead to taps.
 */
const ROW_HIT_AREA = [contentShape(shapes.rectangle())]

/**
 * Reproduces `ListRow`'s current card background
 * (`secondarySystemGroupedBackground`) against the list's own
 * `systemBackground`, which is what makes each row read as a filled row
 * rather than a bare separator-only one.
 */
const ROW_BACKGROUND = listRowBackground(c.secondarySystemGroupedBackground)

/**
 * The row's own disclosure arrow. `@expo/ui` exposes no accessory that adds
 * one without a real `NavigationLink` push -- which these rows don't do,
 * they open a story in the browser -- so it's drawn by hand, matching
 * `DisclosureArrow`'s glyph, size, and colour exactly. Hidden from
 * VoiceOver: it's decorative, and the row's own accessibilityLabel already
 * says what pressing it does.
 */
const CHEVRON_MODIFIERS = [padding({leading: 10}), accessibilityHidden(true)]

/**
 * Reproduces `ListSeparator`'s current `left: 101` inset -- the separator
 * starts past the 70pt thumbnail plus its margin, not at the row's own
 * edge. Only applied to rows that actually have a thumbnail.
 */
const SEPARATOR_INSET_WITH_THUMBNAIL = [alignmentGuide('listRowSeparatorLeading', 101)]

const EXCERPT_MODIFIERS = [lineLimit(3), foregroundStyle(c.secondaryLabel)]

type Props = {
	onPress: (link: string) => void
	story: StoryType
	thumbnail: false | ImageResolvedAssetSource
}

export const NewsRow = (props: Props): React.ReactNode => {
	let _onPress = () => {
		if (!props.story.link) {
			Alert.alert('There is nowhere to go for this story')
			return
		}
		props.onPress(props.story.link)
	}

	let {story} = props

	let thumb =
		props.thumbnail !== false
			? story.featuredImage
				? {uri: story.featuredImage}
				: props.thumbnail
			: null

	return (
		<Button
			modifiers={[
				PLAIN_BUTTON,
				ROW_BACKGROUND,
				accessibilityIdentifier(`${NEWS_ROW_PREFIX}${story.title}`),
				accessibilityLabel(`${story.title}. ${story.excerpt}`),
				...(thumb !== null ? SEPARATOR_INSET_WITH_THUMBNAIL : []),
			]}
			onPress={_onPress}
		>
			<HStack alignment="top" modifiers={ROW_HIT_AREA} spacing={8}>
				<HStack
					alignment="center"
					modifiers={[frame({maxWidth: Infinity, alignment: 'leading'})]}
					spacing={15}
				>
					{thumb !== null ? (
						<VStack modifiers={[frame({width: 70, height: 70})]}>
							{/* `matchContents={false}` + a frame-constrained parent, not
							    `matchContents={true}`: an RNHostView hosting per-row remote
							    image content inside a List cannot measure an RN view handed
							    no constraints, and collapses the whole list rather than just
							    this one row. */}
							<RNHostView matchContents={false}>
								<Image
									accessibilityIgnoresInvertColors={true}
									source={thumb}
									style={styles.image}
								/>
							</RNHostView>
						</VStack>
					) : null}
					<VStack alignment="leading" spacing={4}>
						<Text modifiers={[lineLimit(2)]}>{story.title}</Text>
						<Text modifiers={EXCERPT_MODIFIERS}>{story.excerpt}</Text>
					</VStack>
				</HStack>
				<SwiftUIImage
					color={c.secondaryLabel}
					modifiers={CHEVRON_MODIFIERS}
					size={20}
					systemName="chevron.right"
				/>
			</HStack>
		</Button>
	)
}

const styles = StyleSheet.create({
	image: {
		backgroundColor: c.white,
		borderRadius: 5,
		height: 70,
		width: 70,
	},
})
