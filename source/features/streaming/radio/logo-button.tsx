import * as React from 'react'
import {Pressable} from 'react-native'
import Animated, {useAnimatedStyle, useSharedValue, withSpring} from 'react-native-reanimated'

/** How far the logo shrinks under a finger. */
const PRESSED_SCALE = 0.95

type Props = {
	accessibilityLabel: string
	onPress: () => void
	children: React.ReactNode
}

/**
 * A logo that can be tapped. It shrinks slightly while pressed rather than
 * dimming, so the artwork keeps its colours.
 */
export function LogoButton(props: Props): React.ReactNode {
	let {accessibilityLabel, onPress, children} = props
	let scale = useSharedValue(1)
	let shrunk = useAnimatedStyle(() => ({transform: [{scale: scale.get()}]}))

	return (
		<Pressable
			accessibilityHint="Shows another logo."
			accessibilityLabel={accessibilityLabel}
			accessibilityRole="button"
			onPress={onPress}
			onPressIn={() => scale.set(withSpring(PRESSED_SCALE, {duration: 150}))}
			onPressOut={() => scale.set(withSpring(1, {duration: 250}))}
		>
			<Animated.View style={shrunk}>{children}</Animated.View>
		</Pressable>
	)
}
