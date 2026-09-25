import * as React from 'react'
import {useCallback, useEffect, useRef} from 'react'
import {
	GestureResponderEvent,
	Image,
	ImageResolvedAssetSource,
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
	withSpring,
	withTiming,
} from 'react-native-reanimated'
import {scheduleOnRN} from 'react-native-worklets'
import * as c from '@frogpond/colors'
import * as logos from '../../../../images/streaming'

import {
	angleAround,
	isTap,
	releaseVelocity,
	turnBetween,
	type ScratchSample,
} from './scratch-gesture'

/** How far a pressed logo shrinks: about 4pt across a 268pt logo. */
const PRESSED_SCALE = 0.985

/** The centre label's share of the record's width, near a 7-inch single's. */
const LABEL_SIZE = 0.55

/** One turn every 2.4 seconds, the speed of the record in KSTO's own 2017 app. */
const MS_PER_TURN = 2400
const DEGREES_PER_SECOND = 360 / (MS_PER_TURN / 1000)

type Props = {
	/** The logo, drawn on the record's centre label. */
	image: ImageResolvedAssetSource
	labelColor: string
	/** How much of the label's width the logo takes. */
	labelScale: number
	/** The record's width and height, in points. */
	size: number
	accessibilityLabel: string
	/** Turns the record on its own, unless Reduce Motion is on. */
	playing: boolean
	onTap?: () => void
	/**
	 * Told when a finger lands on the logo and when it lifts, so a scroll view
	 * around it can hold still while the logo is scratched.
	 */
	onHeldChange?: (held: boolean) => void
	/** Told when a scratch is over and the logo has stopped coasting. */
	onSettle?: () => void
}

/**
 * A logo on the label of a record a finger can scratch: dragging turns it
 * around its centre, and a touch that barely moves is a tap. Let go mid-turn
 * and it keeps turning, slowing to a stop, or to its usual speed while the
 * stream plays.
 */
export function ScratchableLogo(props: Props): React.ReactNode {
	let {image, labelColor, labelScale, size, accessibilityLabel, playing} = props
	let {onTap, onHeldChange, onSettle} = props
	let reduceMotion = useReducedMotion()
	let spins = playing && !reduceMotion

	// The logo's angle is its steady spin plus what scratching has added, so a
	// fling can ease back into the spin rather than stopping first.
	let spin = useSharedValue(0)
	let scratched = useSharedValue(0)
	// Shrinks under a finger, until the touch becomes a scratch.
	let scale = useSharedValue(1)
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
		scale.set(withSpring(PRESSED_SCALE, {duration: 150}))
		// A finger on a coasting logo stops it, as it would a real record.
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
			scale.set(withSpring(1, {duration: 250}))
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
		scale.set(withSpring(1, {duration: 250}))
		if (lastAngle.current === null) {
			onTap?.()
			onSettle?.()
			return
		}

		startSpinning()
		if (reduceMotion) {
			onSettle?.()
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
		scratched.set(
			withDecay({velocity: spins ? velocity - DEGREES_PER_SECOND : velocity}, (finished) => {
				if (finished && onSettle) {
					scheduleOnRN(onSettle)
				}
			}),
		)
	}

	let turned = useAnimatedStyle(() => ({
		transform: [{scale: scale.get()}, {rotate: `${spin.get() + scratched.get()}deg`}],
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
				scale.set(withSpring(1, {duration: 250}))
				startSpinning()
				onSettle?.()
			}}
			// A scroll view would otherwise take over a scratch that drifts
			// vertically.
			onResponderTerminationRequest={() => false}
			onStartShouldSetResponder={() => true}
		>
			<Animated.View style={[{width: size, height: size}, turned]}>
				<Image source={logos.vinyl} style={styles.disc} />
				<View style={[styles.label, {backgroundColor: labelColor}]}>
					<Image
						resizeMode="contain"
						source={image}
						style={{width: `${labelScale * 100}%`, height: `${labelScale * 100}%`}}
					/>
				</View>
			</Animated.View>
		</View>
	)
}

const styles = StyleSheet.create({
	label: {
		position: 'absolute',
		top: `${((1 - LABEL_SIZE) / 2) * 100}%`,
		left: `${((1 - LABEL_SIZE) / 2) * 100}%`,
		width: `${LABEL_SIZE * 100}%`,
		height: `${LABEL_SIZE * 100}%`,
		borderRadius: 9999,
		overflow: 'hidden',
		alignItems: 'center',
		justifyContent: 'center',
	},
	// The vinyl is nearly black, so without a rim its edge disappears against
	// Dark Mode's background. The size is explicit because an image source
	// carries its own, which would otherwise win over the fill.
	disc: {
		width: '100%',
		height: '100%',
		borderRadius: 9999,
		borderColor: c.systemGray4,
		borderWidth: 1,
	},
})
