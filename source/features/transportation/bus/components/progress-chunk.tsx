import * as React from 'react'
import {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react'
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
/** What the dot adds to the column's height, once its overlap is counted. */
const DOT_FLOW_HEIGHT = DOT_SIZE - DOT_OVERLAP * 2

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
	busIconShadow: {
		shadowOffset: {width: 0, height: 1},
		shadowOpacity: 0.2,
		shadowRadius: 2,
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
		// The row's own background, so an unvisited stop reads as a hole punched
		// in the bar. A systemFill is translucent by design and lets it through.
		backgroundColor: c.secondarySystemGroupedBackground,
		height: BUS_ICON_SIZE,
		width: BUS_ICON_SIZE,
	},
	atStop: {
		height: 20,
		width: 20,
		borderWidth: 3,
		backgroundColor: c.secondarySystemGroupedBackground,
	},
})

type Props = {
	barColor: ColorValue
	currentStopColor: ColorValue
	isFirstChunk: boolean
	isLastChunk: boolean
	stopStatus: BusStopStatusEnum
	busProgress?: number | null
	busAtStop?: boolean
}

export function ProgressChunk(props: Props): React.ReactNode {
	let {stopStatus, barColor, currentStopColor, busProgress, busAtStop} = props

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

	let isMeasured = aboveHeight > 0 && belowHeight > 0
	let showBusOnBar = busProgress != null && !busAtStop && isMeasured
	let showBusAtDot = busAtStop === true

	// This row draws the whole leg from the previous stop to its own, reaching up
	// past its top edge to start. Rows paint in order, so that overhang lands on
	// top of the row above; a row reaching *down* would be painted over by the
	// next row's opaque background and lose half the bus at the boundary.
	let ownDotY = aboveHeight + DOT_CENTER_OFFSET
	let dotToDotDistance = aboveHeight + belowHeight + DOT_FLOW_HEIGHT

	let animatedPosition = useRef(new Animated.Value(0)).current
	let reducedMotion = useRef(false)
	let hasPositioned = useRef(false)

	useEffect(() => {
		AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
			reducedMotion.current = enabled
		})
	}, [])

	useLayoutEffect(() => {
		if (!showBusOnBar || busProgress == null) {
			hasPositioned.current = false
			return
		}

		let targetPosition = ownDotY - dotToDotDistance * (1 - busProgress)

		// The first placement in a row is a jump, not a slide: the bus arrives here
		// already partway along the leg, having been drawn by the row it just left.
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
	}, [showBusOnBar, busProgress, ownDotY, dotToDotDistance, animatedPosition])

	let busIcon = (
		<SymbolView
			name="bus.fill"
			size={BUS_ICON_SIZE}
			style={styles.busIconShadow}
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
				{showBusOnBar ? animatedBusIcon : null}
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
			</View>
		</View>
	)
}
