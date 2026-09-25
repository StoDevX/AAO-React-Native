import * as React from 'react'
import {
	Image as RNImage,
	type NativeScrollEvent,
	type NativeSyntheticEvent,
	Pressable,
	ScrollView,
	StyleSheet,
	View,
	useWindowDimensions,
	type GestureResponderEvent,
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
import {LoadingView, NoticeView} from '@frogpond/notice'
import {SafeAreaView} from 'react-native-safe-area-context'
import {useDismissOnce} from '../../lib/use-dismiss-once'
import {imageLabel} from './lib/byline'
import {useMessStory} from './use-mess-story'

/** Apple's smallest comfortable tap target, in points. */
const TAP_TARGET = 44
/** How far a double tap zooms in. */
const DOUBLE_TAP_SCALE = 2.5
/** The longest gap between two taps that still makes a double tap, in milliseconds. */
const DOUBLE_TAP_MS = 300

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

type Props = {id: number}

/**
 * A comic or piece of artwork on its own, on black, to pinch or double-tap to zoom.
 *
 * The zooming view is a React Native `ScrollView`, because `@expo/ui` has no view that
 * zooms; the close button over it is SwiftUI.
 */
export function ImageViewer({id}: Props): React.ReactNode {
	let close = useDismissOnce()
	let {width, height} = useWindowDimensions()
	let query = useMessStory(id)
	let story = query.data
	let image = story?.layout.kind === 'image' ? story.layout.image : null

	let scrollView = React.useRef<ScrollView>(null)
	// The scroll view zooms itself on a pinch, so its scale is read back from its scroll events.
	let scale = React.useRef(1)
	let lastTap = React.useRef(0)

	let onScroll = React.useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
		scale.current = event.nativeEvent.zoomScale
	}, [])

	let onTap = React.useCallback(
		(event: GestureResponderEvent) => {
			let now = event.nativeEvent.timestamp
			let isDoubleTap = now - lastTap.current < DOUBLE_TAP_MS
			lastTap.current = isDoubleTap ? 0 : now
			if (!isDoubleTap) return

			if (scale.current > 1) {
				scrollView.current?.scrollResponderZoomTo({x: 0, y: 0, width, height, animated: true})
				return
			}
			// Zoom in on the point tapped, which the image's own coordinates give at any scale.
			let {locationX, locationY} = event.nativeEvent
			let zoomedWidth = width / DOUBLE_TAP_SCALE
			let zoomedHeight = height / DOUBLE_TAP_SCALE
			scrollView.current?.scrollResponderZoomTo({
				x: locationX - zoomedWidth / 2,
				y: locationY - zoomedHeight / 2,
				width: zoomedWidth,
				height: zoomedHeight,
				animated: true,
			})
		},
		[width, height],
	)

	let content: React.ReactNode
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
				<Pressable accessible={false} onPress={onTap}>
					<RNImage
						accessibilityIgnoresInvertColors={true}
						accessibilityLabel={imageLabel(story)}
						accessibilityRole="image"
						accessible={true}
						resizeMode="contain"
						source={{uri: image.url}}
						style={{width, height}}
					/>
				</Pressable>
			</ScrollView>
		)
	} else if (query.isPending) {
		content = <LoadingView />
	} else if (query.isLoadingError) {
		content = (
			<NoticeView
				buttonText="Try Again"
				onPress={() => query.refetch()}
				style={styles.notice}
				text={`A problem occurred while loading: ${query.error}`}
				textStyle={styles.noticeText}
			/>
		)
	} else {
		content = (
			<NoticeView style={styles.notice} text="Image unavailable" textStyle={styles.noticeText} />
		)
	}

	return (
		<View style={styles.page}>
			{content}
			<SafeAreaView
				edges={['top', 'left', 'right']}
				pointerEvents="box-none"
				style={styles.overlay}
			>
				<View pointerEvents="box-none" style={styles.closeRow}>
					<Host style={styles.closeHost}>
						<Button modifiers={CLOSE} onPress={close}>
							<Image modifiers={CLOSE_ICON} systemName="xmark" />
						</Button>
					</Host>
				</View>
			</SafeAreaView>
		</View>
	)
}

const styles = StyleSheet.create({
	page: {flex: 1, backgroundColor: 'black'},
	fill: {flex: 1},
	overlay: {position: 'absolute', top: 0, right: 0, bottom: 0, left: 0},
	closeRow: {flexDirection: 'row', justifyContent: 'flex-end', padding: 8},
	closeHost: {width: TAP_TARGET, height: TAP_TARGET},
	notice: {backgroundColor: 'black'},
	noticeText: {color: 'white'},
})
