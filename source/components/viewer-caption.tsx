import * as React from 'react'
import {
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
	useWindowDimensions,
	type TextLayoutEvent,
} from 'react-native'
import {TAP_TARGET} from '../lib/tap-target'

/** How many lines a caption takes before it is cut off with an ellipsis. */
const COLLAPSED_LINES = 3

/** The share of the window an expanded caption takes at most; past that, it scrolls. */
const EXPANDED_HEIGHT = 0.4

type Props = {
	text: string
}

/**
 * A picture's caption, in white on a dark panel over the picture. Past three lines it is cut
 * off, and "Show more" opens it to its full length, in a view that scrolls once it is taller than
 * a share of the window, so a poem in a caption can be read to the end. A caption with no
 * words draws nothing.
 */
export function ViewerCaption({text}: Props): React.ReactNode {
	let words = text.trim()
	if (!words) return null
	// A new picture's caption starts collapsed, as the last one's state says nothing of it.
	return <Caption key={words} text={words} />
}

function Caption({text}: Props): React.ReactNode {
	let {height} = useWindowDimensions()
	let [expanded, setExpanded] = React.useState(false)
	let [cutOff, setCutOff] = React.useState(false)

	// A caption that fills the cap may have more lines than it shows, whether or not the platform
	// reports the lines past the cap, so one that fills it is treated as cut off.
	let onTextLayout = React.useCallback((event: TextLayoutEvent) => {
		setCutOff(event.nativeEvent.lines.length >= COLLAPSED_LINES)
	}, [])

	let caption = (
		<Text
			numberOfLines={expanded ? undefined : COLLAPSED_LINES}
			onTextLayout={onTextLayout}
			style={styles.text}
		>
			{text}
		</Text>
	)

	let maxHeight = height * EXPANDED_HEIGHT

	return (
		// Only the toggle and an opened caption's scroll view take touches; a pinch, a double tap
		// or a drag to close that starts on the rest reaches the picture beneath.
		<View pointerEvents="box-none" style={styles.panel} testID="viewer-caption">
			{expanded ? (
				<ScrollView
					indicatorStyle="white"
					style={[styles.scroll, {maxHeight}]}
					testID="viewer-caption-scroll"
				>
					{caption}
				</ScrollView>
			) : (
				<View pointerEvents="none">{caption}</View>
			)}
			{cutOff || expanded ? (
				<Pressable
					accessibilityLabel={expanded ? 'Show less' : 'Show more'}
					accessibilityRole="button"
					onPress={() => setExpanded(!expanded)}
					style={styles.toggle}
				>
					<Text style={styles.toggleText}>{expanded ? 'Show less' : 'Show more'}</Text>
				</Pressable>
			) : null}
		</View>
	)
}

const styles = StyleSheet.create({
	panel: {
		backgroundColor: 'rgba(0, 0, 0, 0.6)',
		borderRadius: 12,
		paddingHorizontal: 14,
		paddingTop: 10,
	},
	scroll: {flexGrow: 0},
	text: {color: 'white', fontSize: 15, lineHeight: 21, paddingBottom: 10},
	toggle: {
		alignItems: 'flex-start',
		justifyContent: 'center',
		minHeight: TAP_TARGET,
		marginTop: -10,
	},
	toggleText: {color: 'white', fontSize: 15, fontWeight: '600'},
})
