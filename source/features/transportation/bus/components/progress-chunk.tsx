import * as React from 'react'
import {useCallback, useEffect, useRef, useState} from 'react'
import * as c from '@frogpond/colors'
import {
	AccessibilityInfo,
	Animated,
	ColorValue,
	LayoutChangeEvent,
	StyleSheet,
	View,
} from 'react-native'
import {SymbolView} from 'expo-symbols'
import type {BusStopStatusEnum} from '../lib'

const BUS_ICON_SIZE = 18
const BAR_WIDTH = 5
/** Half of `barContainer`'s content box, which is where the bar is drawn. */
const BAR_CENTER_X = 20
const DOT_SIZE = 15
/** The dot's negative margin, which pulls it up onto the bar above it. */
const DOT_OVERLAP = 10

/** Centres a bus icon of `BUS_ICON_SIZE` on the bar running through a segment. */
const BUS_ICON_LEFT = BAR_WIDTH / 2 - BUS_ICON_SIZE / 2
/** Distance from a segment's top edge to the centre of the dot beneath it. */
const DOT_CENTER_OFFSET = DOT_SIZE / 2 - DOT_OVERLAP

const styles = StyleSheet.create({
	barContainer: {
		paddingRight: 5,
		width: 45,
		flexDirection: 'column',
		alignItems: 'center',
	},
	barSegment: {
		flex: 1,
		width: BAR_WIDTH,
	},
	bar: {
		flex: 1,
		width: BAR_WIDTH,
	},
	busIcon: {
		position: 'absolute',
		left: BUS_ICON_LEFT,
		top: -BUS_ICON_SIZE / 2,
		width: BUS_ICON_SIZE,
		height: BUS_ICON_SIZE,
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 2,
	},
	busIconAtStop: {
		position: 'absolute',
		left: BAR_CENTER_X - BUS_ICON_SIZE / 2,
		width: BUS_ICON_SIZE,
		height: BUS_ICON_SIZE,
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 3,
	},
	dot: {
		height: DOT_SIZE,
		width: DOT_SIZE,
		marginVertical: -DOT_OVERLAP,
		borderRadius: 20,
		zIndex: 1,
	},
	skippingStop: {
		backgroundColor: c.clear,
		borderColor: c.transparent,
	},
	passedStop: {
		height: 12,
		width: 12,
	},
	beforeStop: {
		borderWidth: 3,
		backgroundColor: c.systemFill,
		height: BUS_ICON_SIZE,
		width: BUS_ICON_SIZE,
	},
	atStop: {
		height: 20,
		width: 20,
		borderColor: c.systemFill,
		borderWidth: 3,
		backgroundColor: c.systemFill,
	},
})

/**
 * Which half of a stop-to-stop gap this row draws the bus in: the bar below the
 * stop the bus has left, or the bar above the stop it is heading to.
 */
export type BusSegment = 'above' | 'below'

type Props = {
	barColor: ColorValue
	currentStopColor: ColorValue
	isFirstChunk: boolean
	isLastChunk: boolean
	stopStatus: BusStopStatusEnum
	busProgress?: number | null
	busSegment?: BusSegment
	busAtStop?: boolean
}

export function ProgressChunk(props: Props): React.ReactNode {
	let {stopStatus, barColor, currentStopColor, busProgress, busSegment, busAtStop} = props

	// To draw the bar, we draw a chunk of the bar, then we draw the dot, then
	// we draw the last chunk of the bar.
	let startBarColor = barColor
	let endBarColor = barColor

	let [aboveHeight, setAboveHeight] = useState(0)
	let [belowHeight, setBelowHeight] = useState(0)

	let onAboveLayout = useCallback((event: LayoutChangeEvent) => {
		setAboveHeight(event.nativeEvent.layout.height)
	}, [])

	let onBelowLayout = useCallback((event: LayoutChangeEvent) => {
		setBelowHeight(event.nativeEvent.layout.height)
	}, [])

	let segmentHeight = busSegment === 'below' ? belowHeight : aboveHeight
	let showBusOnBar = busProgress != null && !busAtStop && segmentHeight > 0
	let showBusAtDot = busAtStop === true

	let animatedPosition = useRef(new Animated.Value(0)).current
	let reducedMotion = useRef(false)
	let hasPositioned = useRef(false)

	useEffect(() => {
		AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
			reducedMotion.current = enabled
		})
	}, [])

	useEffect(() => {
		if (!showBusOnBar || busProgress == null) {
			hasPositioned.current = false
			return
		}

		let targetPosition = busProgress * segmentHeight

		// The first placement in a row is a jump, not a slide: animating it would
		// send the bus down from the row's top edge every time it crosses a stop.
		if (reducedMotion.current || !hasPositioned.current) {
			animatedPosition.setValue(targetPosition)
			hasPositioned.current = true
			return
		}

		Animated.spring(animatedPosition, {
			toValue: targetPosition,
			useNativeDriver: true,
			damping: 15,
			stiffness: 100,
		}).start()
	}, [showBusOnBar, busProgress, segmentHeight, animatedPosition])

	let busIcon = (
		<SymbolView
			name="bus.fill"
			size={BUS_ICON_SIZE}
			style={{shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.2, shadowRadius: 2}}
			tintColor={currentStopColor as string}
		/>
	)

	let animatedBusIcon = (
		<Animated.View style={[styles.busIcon, {transform: [{translateY: animatedPosition}]}]}>
			{busIcon}
		</Animated.View>
	)

	return (
		<View style={styles.barContainer}>
			<View onLayout={onAboveLayout} style={styles.barSegment}>
				<View style={[styles.bar, {backgroundColor: startBarColor}]} />
				{showBusOnBar && busSegment !== 'below' ? animatedBusIcon : null}
			</View>
			<View
				style={[
					styles.dot,
					stopStatus === 'after' && [
						styles.passedStop,
						{borderColor: barColor, backgroundColor: barColor},
					],
					stopStatus === 'before' && [styles.beforeStop, {borderColor: barColor}],
					stopStatus === 'at' && [styles.atStop, {borderColor: currentStopColor}],
					stopStatus === 'skip' && styles.skippingStop,
					showBusAtDot && {opacity: 0},
				]}
			/>
			{showBusAtDot ? (
				<View
					style={[styles.busIconAtStop, {top: aboveHeight + DOT_CENTER_OFFSET - BUS_ICON_SIZE / 2}]}
				>
					{busIcon}
				</View>
			) : null}
			<View onLayout={onBelowLayout} style={styles.barSegment}>
				<View style={[styles.bar, {backgroundColor: endBarColor}]} />
				{showBusOnBar && busSegment === 'below' ? animatedBusIcon : null}
			</View>
		</View>
	)
}
