import * as React from 'react'
import {
	Image as RNImage,
	type NativeScrollEvent,
	type NativeSyntheticEvent,
	ScrollView,
	StyleSheet,
	View,
	useWindowDimensions,
} from 'react-native'
import {Button, Host, Image} from '@expo/ui/swift-ui'
import {
	accessibilityIdentifier,
	accessibilityLabel,
	background,
	buttonStyle,
	contentShape,
	font,
	foregroundStyle,
	frame,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {DoubleTapView, type DoubleTapPoint} from '@frogpond/double-tap'
import {useDismissOnce} from '../../lib/use-dismiss-once'
import {imageLabel, picturePlace} from './lib/byline'
import {doubleTapZoom} from './lib/zoom'
import {StoryLookupNotice} from './story-lookup-notice'
import {useMessStory} from './use-mess-story'
import type {MessStory, Photo} from './types'

/** Apple's smallest comfortable tap target, in points. */
const TAP_TARGET = 44

const CLOSE = [
	buttonStyle('plain'),
	accessibilityLabel('Close'),
	accessibilityIdentifier('mess-image-viewer-close'),
]
const CLOSE_ICON = [
	font({textStyle: 'headline', weight: 'semibold'}),
	foregroundStyle('white'),
	frame({width: TAP_TARGET, height: TAP_TARGET}),
	background('rgba(0, 0, 0, 0.5)', shapes.circle()),
	contentShape(shapes.circle()),
]

/**
 * The picture the viewer shows: a comic's or artwork's one picture, or the feature page's
 * picture at `index`. Null when the story has no picture there.
 */
function pictureOf(story: MessStory | undefined, index: number): Photo | null {
	if (story?.layout.kind === 'image') return story.layout.image
	if (story?.layout.kind === 'feature') return story.layout.images[index] ?? null
	return null
}

type Props = {
	id: number
	/** Which of a feature page's pictures to show; a comic or artwork has only the one */
	index?: number
}

/**
 * A comic, a piece of artwork or a feature page's picture on its own, on black, to pinch or double-tap to zoom.
 *
 * The zooming view is a React Native `ScrollView`, because `@expo/ui` has no view that
 * zooms; the close button over it is SwiftUI.
 */
export function ImageViewer({id, index = 0}: Props): React.ReactNode {
	let close = useDismissOnce()
	let {width, height} = useWindowDimensions()
	let insets = useSafeAreaInsets()
	let query = useMessStory(id)
	let story = query.data
	let image = pictureOf(story, index)

	let scrollView = React.useRef<ScrollView>(null)
	// The scroll view zooms itself on a pinch, so its scale is read back from its scroll events,
	// which React Native sends for every frame of a zoom at a throttle of one frame or less.
	let scale = React.useRef(1)

	let onScroll = React.useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
		scale.current = event.nativeEvent.zoomScale
	}, [])

	// The point arrives in the image's own coordinates, which hold at any scale.
	let onDoubleTap = React.useCallback(
		(point: DoubleTapPoint) => {
			let zoom = doubleTapZoom(scale.current, point, {width, height})
			scrollView.current?.scrollResponderZoomTo({...zoom.rect, animated: true})
			// Where the zoom will land, so a double tap before its scroll events arrive still
			// knows which way to go.
			scale.current = zoom.scale
		},
		[width, height],
	)

	let content: React.ReactNode = (
		<StoryLookupNotice
			query={query}
			style={styles.notice}
			textStyle={styles.noticeText}
			unavailableText="Image unavailable"
		/>
	)
	if (image && story) {
		content = (
			<ScrollView
				centerContent={true}
				maximumZoomScale={4}
				minimumZoomScale={1}
				onScroll={onScroll}
				ref={scrollView}
				scrollEventThrottle={16}
				showsHorizontalScrollIndicator={false}
				showsVerticalScrollIndicator={false}
				style={styles.fill}
			>
				<DoubleTapView onDoubleTap={onDoubleTap}>
					<RNImage
						accessibilityIgnoresInvertColors={true}
						accessibilityLabel={imageLabel(story, picturePlace(story, index))}
						accessibilityRole="image"
						accessible={true}
						resizeMode="contain"
						source={{uri: image.url}}
						// Sized to the window, which the image fills at 1×.
						style={[styles.image, {width, height}]}
						testID="mess-image-viewer-image"
					/>
				</DoubleTapView>
			</ScrollView>
		)
	}

	return (
		// The page takes VoiceOver's escape gesture, a two-finger scrub, as Close.
		<View onAccessibilityEscape={close} style={styles.page}>
			{content}
			<View
				pointerEvents="box-none"
				style={[
					styles.overlay,
					{paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right},
				]}
			>
				<View pointerEvents="box-none" style={styles.closeRow}>
					<Host style={styles.closeHost}>
						<Button modifiers={CLOSE} onPress={close}>
							<Image modifiers={CLOSE_ICON} systemName="xmark" />
						</Button>
					</Host>
				</View>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	page: {flex: 1, backgroundColor: 'black'},
	fill: {flex: 1},
	image: {backgroundColor: 'black'},
	overlay: {position: 'absolute', top: 0, right: 0, bottom: 0, left: 0},
	closeRow: {flexDirection: 'row', justifyContent: 'flex-end', padding: 8},
	closeHost: {width: TAP_TARGET, height: TAP_TARGET},
	notice: {backgroundColor: 'black'},
	noticeText: {color: 'white'},
})
