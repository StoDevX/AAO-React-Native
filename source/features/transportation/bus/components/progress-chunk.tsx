import * as React from 'react'
import {useEffect, useRef} from 'react'
import * as c from '@frogpond/colors'
import {AccessibilityInfo, Animated, ColorValue, StyleSheet, View} from 'react-native'
import {SymbolView} from 'expo-symbols'
import type {BusStopStatusEnum} from '../lib'

const TOP_BAR_HEIGHT = 20

const styles = StyleSheet.create({
	barContainer: {
		paddingRight: 5,
		width: 45,
		flexDirection: 'column',
		alignItems: 'center',
	},
	bar: {
		flex: 1,
		width: 5,
	},
	topBarWrapper: {
		flex: 1,
		width: 5,
		position: 'relative',
	},
	topBar: {
		flex: 1,
		width: 5,
	},
	busIcon: {
		position: 'absolute',
		left: -6.5,
		width: 18,
		height: 18,
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 2,
	},
	busIconAtStop: {
		zIndex: 2,
	},
	dot: {
		height: 15,
		width: 15,
		marginVertical: -10,
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
		height: 18,
		width: 18,
	},
	atStop: {
		height: 20,
		width: 20,
		borderColor: c.systemFill,
		borderWidth: 3,
		backgroundColor: c.systemFill,
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

	let animatedPosition = useRef(new Animated.Value(0)).current
	let reducedMotion = useRef(false)

	useEffect(() => {
		AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
			reducedMotion.current = enabled
		})
	}, [])

	useEffect(() => {
		if (busProgress == null) {
			return
		}

		let targetPosition = busProgress * TOP_BAR_HEIGHT

		if (reducedMotion.current) {
			animatedPosition.setValue(targetPosition)
		} else {
			Animated.spring(animatedPosition, {
				toValue: targetPosition,
				useNativeDriver: true,
				damping: 15,
				stiffness: 100,
			}).start()
		}
	}, [busProgress, animatedPosition])

	let showBusOnBar = busProgress != null && !busAtStop
	let showBusAtDot = busAtStop === true

	return (
		<View style={styles.barContainer}>
			<View style={styles.topBarWrapper}>
				<View style={[styles.topBar, {backgroundColor: startBarColor}]} />
				{showBusOnBar && (
					<Animated.View
						style={[
							styles.busIcon,
							{
								transform: [{translateY: animatedPosition}],
							},
						]}
					>
						<SymbolView
							name="bus.fill"
							size={18}
							style={{shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.2, shadowRadius: 2}}
							tintColor={currentStopColor as string}
						/>
					</Animated.View>
				)}
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
			{showBusAtDot && (
				<View style={[styles.busIcon, styles.busIconAtStop, {position: 'absolute'}]}>
					<SymbolView
						name="bus.fill"
						size={18}
						style={{shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.2, shadowRadius: 2}}
						tintColor={currentStopColor as string}
					/>
				</View>
			)}
			<View style={[styles.bar, {backgroundColor: endBarColor}]} />
		</View>
	)
}
