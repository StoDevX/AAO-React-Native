import * as React from 'react'
import {useCallback, useEffect, useRef} from 'react'
import {
	GestureResponderEvent,
	ImageResolvedAssetSource,
	ImageStyle,
	StyleProp,
	StyleSheet,
	View,
} from 'react-native'
import Animated, {
	Easing,
	cancelAnimation,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withRepeat,
	withTiming,
} from 'react-native-reanimated'
import * as c from '@frogpond/colors'

import {angleAround, isTap, turnBetween} from './record-gesture'

/** One turn every 2.4 seconds, the speed of the record in KSTO's own 2017 app. */
const MS_PER_TURN = 2400

type Props = {
	image: ImageResolvedAssetSource
	style: StyleProp<ImageStyle>
	accessibilityLabel: string
	/** Spins the record, unless Reduce Motion is on. */
	spinning: boolean
	onTap?: () => void
	/**
	 * Told when a finger lands on the record and when it lifts, so a scroll
	 * view around it can hold still while the record is scratched.
	 */
	onHeldChange?: (held: boolean) => void
}

/**
 * A record a finger can scratch: dragging turns it around its centre, and a
 * touch that barely moves is a tap.
 */
export function RecordLogo(props: Props): React.ReactNode {
	let {image, style, accessibilityLabel, spinning, onTap, onHeldChange} = props
	let reduceMotion = useReducedMotion()
	let spins = spinning && !reduceMotion

	let rotation = useSharedValue(0)
	let view = useRef<View>(null)
	let centre = useRef({x: 0, y: 0})
	let start = useRef({x: 0, y: 0})
	// Null until the touch has moved far enough to be a scratch.
	let lastAngle = useRef<number | null>(null)

	let startSpinning = useCallback(() => {
		if (!spins) {
			return
		}
		rotation.set(
			withRepeat(
				withTiming(rotation.get() + 360, {duration: MS_PER_TURN, easing: Easing.linear}),
				-1,
			),
		)
	}, [rotation, spins])

	useEffect(() => {
		startSpinning()
		return () => cancelAnimation(rotation)
	}, [rotation, startSpinning])

	let handleGrant = (event: GestureResponderEvent) => {
		onHeldChange?.(true)
		start.current = {x: event.nativeEvent.pageX, y: event.nativeEvent.pageY}
		lastAngle.current = null
		view.current?.measureInWindow((x, y, width, height) => {
			centre.current = {x: x + width / 2, y: y + height / 2}
		})
	}

	let handleMove = (event: GestureResponderEvent) => {
		let point = {x: event.nativeEvent.pageX, y: event.nativeEvent.pageY}
		if (lastAngle.current === null) {
			if (isTap(point.x - start.current.x, point.y - start.current.y)) {
				return
			}
			cancelAnimation(rotation)
			lastAngle.current = angleAround(centre.current, start.current)
		}
		let angle = angleAround(centre.current, point)
		let turn = turnBetween(lastAngle.current, angle)
		rotation.set((value) => value + turn)
		lastAngle.current = angle
	}

	let handleRelease = () => {
		onHeldChange?.(false)
		if (lastAngle.current === null) {
			onTap?.()
		} else {
			startSpinning()
		}
	}

	let turned = useAnimatedStyle(() => ({transform: [{rotate: `${rotation.get()}deg`}]}))

	return (
		<View
			ref={view}
			accessibilityHint={onTap ? 'Shows another logo.' : undefined}
			accessibilityLabel={accessibilityLabel}
			accessibilityRole={onTap ? 'button' : 'image'}
			accessible={true}
			onAccessibilityTap={onTap}
			onResponderGrant={handleGrant}
			onResponderMove={handleMove}
			onResponderRelease={handleRelease}
			onResponderTerminate={() => {
				onHeldChange?.(false)
				startSpinning()
			}}
			// A scroll view would otherwise take over a scratch that drifts
			// vertically.
			onResponderTerminationRequest={() => false}
			onStartShouldSetResponder={() => true}
		>
			<Animated.Image resizeMode="contain" source={image} style={[style, styles.rim, turned]} />
		</View>
	)
}

const styles = StyleSheet.create({
	// The vinyl is nearly black, so without a rim its edge disappears against
	// Dark Mode's background.
	rim: {
		borderRadius: 9999,
		borderColor: c.systemGray4,
		borderWidth: 1,
	},
})
