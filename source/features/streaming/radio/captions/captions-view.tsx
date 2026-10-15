import * as React from 'react'
import {ScrollView, type NativeScrollEvent, StyleSheet, Text, View} from 'react-native'
import Animated, {FadeIn, ReduceMotion} from 'react-native-reanimated'
import {captionStyle, type CaptionsEngineState} from '@frogpond/radio-captions'

import {captionStatus} from './caption-status'
import {captionRows, splitWords} from './caption-rows'
import type {CaptionsState} from './reduce-captions'

/** How close to the end the captions must be scrolled for a new line to keep them pinned there. */
const NEAR_BOTTOM = 80

/** The base size of a caption before the viewer's own caption scale. */
const CAPTION_FONT_SIZE = 20

/** Said instead of the engine's state while the captions are not running. */
const PAUSED_STATUS = 'Captions resume when the station plays'

/** Whether a scroll position is within `NEAR_BOTTOM` of the end of the content. */
function isNearEnd({contentOffset, contentSize, layoutMeasurement}: NativeScrollEvent): boolean {
	return contentOffset.y + layoutMeasurement.height >= contentSize.height - NEAR_BOTTOM
}

/** How long a word takes to fade in. */
const WORD_FADE_MS = 200

/** One word, with the space after it. Memoized, so a word already on screen is not redrawn. */
const CaptionWord = React.memo(function CaptionWord({
	word,
	color,
	fontFamily,
	fontSize,
}: {
	word: string
	color: string
	fontFamily: string | null
	fontSize: number
}): React.ReactNode {
	return (
		<Animated.Text
			entering={FadeIn.duration(WORD_FADE_MS).reduceMotion(ReduceMotion.System)}
			style={[{color, fontSize}, fontFamily === null ? null : {fontFamily}]}
		>
			{`${word} `}
		</Animated.Text>
	)
})

/**
 * A line as words wrapped across the row. Words are keyed by their place in the
 * line, so one already shown is never faded in again, a revised word at the
 * same place just changes, and only words added at the end fade in. VoiceOver
 * reads the line once, not word by word.
 */
const CaptionRow = React.memo(function CaptionRow({
	text,
	color,
	fontFamily,
	fontSize,
}: {
	text: string
	color: string
	fontFamily: string | null
	fontSize: number
}): React.ReactNode {
	return (
		<View accessibilityLabel={text} accessibilityRole="text" accessible={true} style={styles.line}>
			{splitWords(text).map((word, index) => (
				// The place in the line is the word's identity, as described above.
				<CaptionWord
					color={color}
					fontFamily={fontFamily}
					fontSize={fontSize}
					// oxlint-disable-next-line react/no-array-index-key
					key={index}
					word={word}
				/>
			))}
		</View>
	)
})

/**
 * The captions: settled lines and the one being spoken, in the viewer's own
 * caption style. It fills the record's place, which has a fixed height, and
 * scrolls within it, staying on the newest line unless the viewer has scrolled
 * back. A scroll view rather than a list: `useCaptions` keeps at most
 * `MAX_CAPTION_LINES` lines, and React Native flags a virtualized list nested
 * in the sheet's scroll view (see `VirtualizedList`'s nesting check).
 */
export function CaptionsView({
	state,
	engine,
	running,
}: {
	state: CaptionsState
	engine: CaptionsEngineState | null
	/** Whether the engine is wanted: false while the station is paused. */
	running: boolean
}): React.ReactNode {
	// Read once: the style is the viewer's Settings choice and changes only there.
	let [style] = React.useState(() => captionStyle())
	let scroll = React.useRef<ScrollView>(null)
	let pinned = React.useRef(true)
	let rows = captionRows(state)
	let status = running
		? captionStatus(engine, state.lines.length > 0)
		: {text: PAUSED_STATUS, spoken: PAUSED_STATUS}

	return (
		<View style={[styles.panel, {backgroundColor: style.background}]}>
			{status ? (
				<Text accessibilityLabel={status.spoken} style={[styles.status, {color: style.foreground}]}>
					{status.text}
				</Text>
			) : null}
			<ScrollView
				onContentSizeChange={() => {
					// Unanimated, so a tall new line cannot leave the view mid-scroll.
					if (pinned.current) scroll.current?.scrollToEnd({animated: false})
				}}
				// Only the viewer's own scrolling decides whether to keep following,
				// so the view's scrolling to the end cannot unpin it.
				onMomentumScrollEnd={({nativeEvent}) => {
					pinned.current = isNearEnd(nativeEvent)
				}}
				onScrollBeginDrag={({nativeEvent}) => {
					pinned.current = isNearEnd(nativeEvent)
				}}
				onScrollEndDrag={({nativeEvent}) => {
					pinned.current = isNearEnd(nativeEvent)
				}}
				ref={scroll}
				style={styles.list}
				testID="radio-captions-list"
			>
				{rows.map((row) => (
					<CaptionRow
						color={style.foreground}
						fontFamily={style.fontFamily}
						fontSize={CAPTION_FONT_SIZE * style.fontScale}
						key={row.key}
						text={row.text}
					/>
				))}
			</ScrollView>
		</View>
	)
}

const styles = StyleSheet.create({
	// The record's place has a fixed height, so the panel takes it and the
	// captions scroll within it.
	panel: {alignSelf: 'stretch', flex: 1, borderRadius: 12, padding: 16},
	list: {flex: 1},
	status: {fontSize: 15, marginBottom: 8, opacity: 0.8},
	line: {flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8},
})
