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
	withDecay,
	withRepeat,
	withTiming,
} from 'react-native-reanimated'
import * as c from '@frogpond/colors'

import {
	angleAround,
	isTap,
	releaseVelocity,
	turnBetween,
	type ScratchSample,
} from './record-gesture'

/** One turn every 2.4 seconds, the speed of the record in KSTO's own 2017 app. */
const MS_PER_TURN = 2400
const DEGREES_PER_SECOND = 360 / (MS_PER_TURN / 1000)

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
 * touch that barely moves is a tap. Let go mid-turn and it keeps turning,
 * slowing to a stop, or to its usual speed while the stream plays.
 */
export function RecordLogo(props: Props): React.ReactNode {
	let {image, style, accessibilityLabel, spinning, onTap, onHeldChange} = props
	let reduceMotion = useReducedMotion()
	let spins = spinning && !reduceMotion

	// The record's angle is its steady spin plus what scratching has added, so
	// a fling can ease back into the spin rather than stopping first.
	let spin = useSharedValue(0)
	let scratched = useSharedValue(0)
	let view = useRef<View>(null)
	let centre = useRef({x: 0, y: 0})
	let start = useRef({x: 0, y: 0, time: 0})
	// Null until the touch has moved far enough to be a scratch.
	let lastAngle = useRef<number | null>(null)
	let samples = useRef<ScratchSample[]>([])

	let startSpinning = useCallback(() => {
		if (!spins) {
			return
		}
		spin.set(
			withRepeat(withTiming(spin.get() + 360, {duration: MS_PER_TURN, easing: Easing.linear}), -1),
		)
	}, [spin, spins])

	useEffect(() => {
		startSpinning()
		return () => {
			cancelAnimation(spin)
			cancelAnimation(scratched)
		}
	}, [scratched, spin, startSpinning])

	let handleGrant = (event: GestureResponderEvent) => {
		onHeldChange?.(true)
		// A finger on a coasting record stops it, as it would a real one.
		cancelAnimation(scratched)
		start.current = {
			x: event.nativeEvent.pageX,
			y: event.nativeEvent.pageY,
			time: event.nativeEvent.timestamp,
		}
		lastAngle.current = null
		samples.current = []
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
			cancelAnimation(spin)
			lastAngle.current = angleAround(centre.current, start.current)
			samples.current.push({angle: lastAngle.current, time: start.current.time})
		}
		let angle = angleAround(centre.current, point)
		let turn = turnBetween(lastAngle.current, angle)
		scratched.set((value) => value + turn)
		lastAngle.current = angle
		samples.current.push({angle, time: event.nativeEvent.timestamp})
	}

	let handleRelease = (event: GestureResponderEvent) => {
		onHeldChange?.(false)
		if (lastAngle.current === null) {
			onTap?.()
			return
		}

		startSpinning()
		if (reduceMotion) {
			return
		}
		// Where the finger lifted counts too: touches can arrive sparsely, and
		// the last move may be well before the lift.
		samples.current.push({
			angle: angleAround(centre.current, {x: event.nativeEvent.pageX, y: event.nativeEvent.pageY}),
			time: event.nativeEvent.timestamp,
		})
		// The spin supplies its own speed, so the scratch coasts on only what
		// the fling adds beyond it.
		let velocity = releaseVelocity(samples.current, event.nativeEvent.timestamp)
		scratched.set(withDecay({velocity: spins ? velocity - DEGREES_PER_SECOND : velocity}))
	}

	let turned = useAnimatedStyle(() => ({
		transform: [{rotate: `${spin.get() + scratched.get()}deg`}],
	}))

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
