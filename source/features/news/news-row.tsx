import * as React from 'react'
import {Alert, Image, StyleSheet, type ImageResolvedAssetSource} from 'react-native'
import {Button, HStack, RNHostView, Spacer, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityIdentifier,
	accessibilityLabel,
	alignmentGuide,
	buttonStyle,
	contentShape,
	font,
	foregroundStyle,
	frame,
	lineLimit,
	listRowBackground,
	listRowSeparator,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {RowAccessory, destinationTraits} from '../../components/rows'
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
 * derives a button's tappable region from its label, so the empty run below
 * a short excerpt -- and to the right of a short title, before the accessory
 * -- would otherwise be dead to taps.
 */
const ROW_HIT_AREA = [contentShape(shapes.rectangle())]

/**
 * Fills the row so trailing content (the accessory, the text column's own
 * available width) settles against the true trailing edge instead of hugging
 * whatever width the text happens to need.
 */
const FILL_LEADING = [frame({maxWidth: Infinity, alignment: 'leading'})]

/**
 * Reproduces `ListRow`'s current card background
 * (`secondarySystemGroupedBackground`) against the list's own
 * `systemBackground`, which is what makes each row read as a filled row
 * rather than a bare separator-only one.
 */
const ROW_BACKGROUND = listRowBackground(c.secondarySystemGroupedBackground)

/**
 * Starts the separator where the title/excerpt column starts: 70pt for the
 * thumbnail plus the 15pt gap beside it. Only applied to rows that actually
 * have a thumbnail.
 */
const SEPARATOR_INSET_WITH_THUMBNAIL = [alignmentGuide('listRowSeparatorLeading', 70 + 15)]

/** The list's last row draws no bottom separator -- nothing follows it. */
const HIDE_BOTTOM_SEPARATOR = [listRowSeparator('hidden', 'bottom')]

/**
 * `headline` is body-sized but semibold, and scales with Dynamic Type --
 * matching Mail's bold sender line without hardcoding a weight or a fixed
 * point size the way `font({weight: 'bold'})` would.
 */
const TITLE_MODIFIERS = [lineLimit(2), font({textStyle: 'headline'})]

const EXCERPT_MODIFIERS = [
	lineLimit(3),
	font({textStyle: 'subheadline'}),
	foregroundStyle(c.secondaryLabel),
]

type Props = {
	onPress: (link: string) => void
	story: StoryType
	thumbnail: false | ImageResolvedAssetSource
	/** Whether this is the last row in the list -- it draws no bottom separator. */
	isLast: boolean
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
				// A story opens in the browser rather than pushing.
				...destinationTraits('external'),
				...(thumb !== null ? SEPARATOR_INSET_WITH_THUMBNAIL : []),
				...(props.isLast ? HIDE_BOTTOM_SEPARATOR : []),
			]}
			onPress={_onPress}
		>
			<HStack alignment="center" modifiers={[...FILL_LEADING, ...ROW_HIT_AREA]} spacing={15}>
				{thumb !== null ? (
					<VStack modifiers={[frame({width: 70, height: 70})]}>
						{/* `matchContents={false}` + a frame-constrained parent, not
						    `matchContents={true}`: an RNHostView hosting per-row remote
						    image content inside a List cannot measure an RN view handed
						    no constraints, and collapses the whole list rather than just
						    this one row. */}
						<RNHostView matchContents={false}>
							<Image accessibilityIgnoresInvertColors={true} source={thumb} style={styles.image} />
						</RNHostView>
					</VStack>
				) : null}
				<VStack alignment="leading" modifiers={FILL_LEADING} spacing={4}>
					<Text modifiers={TITLE_MODIFIERS}>{story.title}</Text>
					<Text modifiers={EXCERPT_MODIFIERS}>{story.excerpt}</Text>
				</VStack>
				{/* The accessory takes a column of its own beside the text, as
				    Mail's does, rather than sharing the title's line and letting
				    the excerpt run beneath it. A `Spacer` beneath the glyph,
				    inside its own `VStack`, is what pins it to the row's top edge:
				    the outer `HStack` is `alignment="center"`, and a `VStack`
				    stretched to the row's full height settles non-expanding
				    content -- the image -- at its own top before the `Spacer`
				    claims the rest. */}
				<VStack>
					<RowAccessory destination="external" />
					<Spacer />
				</VStack>
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
