import * as React from 'react'
import {ScrollView, type NativeScrollEvent, StyleSheet, Text, View} from 'react-native'
import MaskedView from '@react-native-masked-view/masked-view'
import Animated, {FadeIn, ReduceMotion} from 'react-native-reanimated'
import {captionStyle, type CaptionsEngineState} from '@frogpond/radio-captions'

import {captionStatus} from './caption-status'
import {presentCaption, dimColor} from '../dev-settings/present-caption'
import {useRadioDevStore, type CaptionPresentation} from '../dev-settings/store'
import {captionRows} from './caption-rows'
import {hasContentAbove, hasContentBelow} from './caption-scroll'
import type {CaptionsState} from './reduce-captions'

/** How close to the end the captions must be scrolled for a new line to keep them pinned there. */
const NEAR_BOTTOM = 80

/** The base size of a caption before the viewer's own caption scale. */
const CAPTION_FONT_SIZE = 20

/** How tall the fade at the top, and at the bottom, of the captions is. */
const FADE_HEIGHT = 40

/** How many strips the fade is drawn in. */
const FADE_STEPS = 8

/**
 * The mask's strips for the top edge, top down, each more opaque than the one above (the bottom edge's are these reversed): only the
 * mask's alpha counts, so the colour is black and the panel's background,
 * whatever its own alpha, does not matter.
 */
const FADE_STRIPS = Array.from({length: FADE_STEPS}, (_, step) => ({
	step,
	color: `rgba(0, 0, 0, ${step / FADE_STEPS})`,
}))

/**
 * What shows through: all of the captions, but with `fadeTop` a fade into the
 * top edge and with `fadeBottom` one into the bottom. It is always a mask, so
 * the scroll view is never remounted, which would lose its place, as the fades
 * come and go.
 */
function CaptionsMask({
	fadeTop,
	fadeBottom,
}: {
	fadeTop: boolean
	fadeBottom: boolean
}): React.ReactNode {
	return (
		<View style={styles.mask}>
			{fadeTop ? FADE_STRIPS.map(fadeStrip) : null}
			<View style={styles.maskRest} />
			{fadeBottom ? [...FADE_STRIPS].reverse().map(fadeStrip) : null}
		</View>
	)
}

/** One strip of a fade. */
function fadeStrip({step, color}: {step: number; color: string}): React.ReactNode {
	return <View key={step} style={[styles.fadeStrip, {backgroundColor: color}]} />
}

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
	presentation,
	heldBackWords,
	color,
	fontFamily,
	fontSize,
}: {
	text: string
	/** How the line shows: always `live` for a settled line, which shows whole. */
	presentation: CaptionPresentation
	heldBackWords: number
	color: string
	fontFamily: string | null
	fontSize: number
}): React.ReactNode {
	let {words, dimFrom} = presentCaption(text, {presentation, heldBackWords})
	let dimmed = dimColor(color)
	return (
		<View accessibilityLabel={text} accessibilityRole="text" accessible={true} style={styles.line}>
			{words.map((word, index) => (
				// The place in the line is the word's identity, as described above.
				<CaptionWord
					color={index >= dimFrom ? dimmed : color}
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

/** How large the gap marker is next to a caption. */
const GAP_SCALE = 0.75

/** Said where the captions were off. */
const GAP_TEXT = 'Captions were off'

/** A faint line between what was said before captions were hidden and after, not animated. */
const CaptionGap = React.memo(function CaptionGap({
	color,
	fontSize,
}: {
	color: string
	fontSize: number
}): React.ReactNode {
	return (
		<Text
			accessibilityLabel={GAP_TEXT}
			accessibilityRole="text"
			style={[styles.line, {color: dimColor(color), fontSize: fontSize * GAP_SCALE}]}
		>
			{GAP_TEXT}
		</Text>
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
	// Whether lines have scrolled out of sight above. Set only when it changes.
	let [fades, setFades] = React.useState({top: false, bottom: false})
	let offsetY = React.useRef(0)
	let viewportHeight = React.useRef(0)
	let contentHeight = React.useRef(0)
	// Fades where lines are out of sight above or below. State changes only when
	// either flips, not on every scroll event.
	let updateFades = () => {
		let top = hasContentAbove(offsetY.current)
		let bottom = hasContentBelow(offsetY.current, viewportHeight.current, contentHeight.current)
		setFades((was) => (was.top === top && was.bottom === bottom ? was : {top, bottom}))
	}
	let rows = captionRows(state)
	let presentation = useRadioDevStore((settings) => settings.captionPresentation)
	let heldBackWords = useRadioDevStore((settings) => settings.heldBackWords)
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
			<MaskedView
				maskElement={<CaptionsMask fadeBottom={fades.bottom} fadeTop={fades.top} />}
				style={styles.listArea}
			>
				<ScrollView
					onContentSizeChange={(_width, height) => {
						// Unanimated, so a tall new line cannot leave the view mid-scroll.
						contentHeight.current = height
						if (pinned.current) {
							scroll.current?.scrollToEnd({animated: false})
							// Pinned to the end, the top is wherever the content now overflows to.
							offsetY.current = Math.max(0, height - viewportHeight.current)
						}
						updateFades()
					}}
					onLayout={({nativeEvent}) => {
						viewportHeight.current = nativeEvent.layout.height
						updateFades()
					}}
					onScroll={({nativeEvent}) => {
						offsetY.current = nativeEvent.contentOffset.y
						updateFades()
					}}
					scrollEventThrottle={50}
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
					{rows.map((row) =>
						row.gap ? (
							<CaptionGap
								color={style.foreground}
								fontSize={CAPTION_FONT_SIZE * style.fontScale}
								key={row.key}
							/>
						) : (
							<CaptionRow
								color={style.foreground}
								heldBackWords={row.live ? heldBackWords : 0}
								presentation={row.live ? presentation : 'live'}
								fontFamily={style.fontFamily}
								fontSize={CAPTION_FONT_SIZE * style.fontScale}
								key={row.key}
								text={row.text}
							/>
						),
					)}
				</ScrollView>
			</MaskedView>
		</View>
	)
}

const styles = StyleSheet.create({
	// The record's place has a fixed height, so the panel takes it and the
	// captions scroll within it.
	panel: {alignSelf: 'stretch', flex: 1, borderRadius: 12, padding: 16},
	listArea: {flex: 1},
	list: {flex: 1},
	mask: {flex: 1},
	maskRest: {flex: 1, backgroundColor: 'black'},
	fadeStrip: {height: FADE_HEIGHT / FADE_STEPS},
	status: {fontSize: 15, marginBottom: 8, opacity: 0.8},
	line: {flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8},
})
