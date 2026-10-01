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
import {DragToDismissView} from '@frogpond/drag-to-dismiss'
import {doubleTapZoom} from './lib/zoom'

/** Apple's smallest comfortable tap target, in points. */
const TAP_TARGET = 44

const CLOSE_ICON = [
	font({textStyle: 'headline', weight: 'semibold'}),
	foregroundStyle('white'),
	frame({width: TAP_TARGET, height: TAP_TARGET}),
	background('rgba(0, 0, 0, 0.5)', shapes.circle()),
	contentShape(shapes.circle()),
]

type Props = {
	/** The picture, or null while there is none to show; `placeholder` stands in for it. */
	image: {uri: string; accessibilityLabel: string; testID?: string} | null
	placeholder?: React.ReactNode
	closeTestID: string
	onClose: () => void
}

/**
 * A picture on its own, on black, to pinch or double-tap to zoom, with a close
 * button that stays whether or not there is a picture. At its fitted size, a drag
 * up or down carries the picture away and closes the viewer, fading the black to
 * show the screen beneath, so the viewer must be presented over that screen.
 *
 * The zooming view is a React Native `ScrollView`, because `@expo/ui` has no view that
 * zooms; the close button over it is SwiftUI.
 */
export function ZoomImageViewer({
	image,
	placeholder,
	closeTestID,
	onClose,
}: Props): React.ReactNode {
	let {width, height} = useWindowDimensions()
	let insets = useSafeAreaInsets()

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

	let content = placeholder ?? null
	if (image) {
		content = (
			<ScrollView
				// A fitted picture has nothing to scroll, and the bounce would take the drag
				// that closes the viewer.
				alwaysBounceVertical={false}
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
						accessibilityLabel={image.accessibilityLabel}
						accessibilityRole="image"
						accessible={true}
						resizeMode="contain"
						source={{uri: image.uri}}
						// Sized to the window, which the image fills at 1×.
						style={{width, height}}
						testID={image.testID}
					/>
				</DoubleTapView>
			</ScrollView>
		)
	}

	return (
		// The page takes VoiceOver's escape gesture, a two-finger scrub, as Close, and keeps
		// VoiceOver off the screen beneath.
		<View accessibilityViewIsModal={true} onAccessibilityEscape={onClose} style={styles.page}>
			<DragToDismissView onDismiss={onClose} style={styles.backdrop}>
				{content}
			</DragToDismissView>
			<View
				pointerEvents="box-none"
				style={[
					styles.overlay,
					{paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right},
				]}
			>
				<View pointerEvents="box-none" style={styles.closeRow}>
					<Host style={styles.closeHost}>
						<Button
							modifiers={[
								buttonStyle('plain'),
								accessibilityLabel('Close'),
								accessibilityIdentifier(closeTestID),
							]}
							onPress={onClose}
						>
							<Image modifiers={CLOSE_ICON} systemName="xmark" />
						</Button>
					</Host>
				</View>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	page: {flex: 1},
	backdrop: {flex: 1, backgroundColor: 'black'},
	fill: {flex: 1},
	overlay: {position: 'absolute', top: 0, right: 0, bottom: 0, left: 0},
	closeRow: {flexDirection: 'row', justifyContent: 'flex-end', padding: 8},
	closeHost: {width: TAP_TARGET, height: TAP_TARGET},
})
