import * as React from 'react'
import {
	Platform,
	View,
	Pressable,
	ViewStyle,
	StyleProp,
	PressableStateCallbackType,
	PressableProps,
} from 'react-native'

type Props = PressableProps & {
	borderless?: boolean
	containerStyle?: StyleProp<ViewStyle>
	children: React.ReactChildren | JSX.Element
	style?: StyleProp<ViewStyle>
	highlight?: boolean
	activeOpacity?: number
	underlayColor?: string
}

const CustomPressable = (props: Props): JSX.Element => {
	let {
		borderless = false,
		children,
		containerStyle = {},
		highlight = true,
		style,
		underlayColor = '#d9d9d9',
		activeOpacity = 0.65,
		...passthrough
	} = props

	let containerAdjustmentStyle: (
		state: PressableStateCallbackType,
	) => Array<StyleProp<ViewStyle>>

	if (Platform.OS === 'android') {
		containerAdjustmentStyle = (_state) => [containerStyle]
	} else if (Platform.OS === 'ios') {
		if (highlight) {
			containerAdjustmentStyle = (state) =>
				state.pressed
					? [{backgroundColor: underlayColor}, containerStyle]
					: [containerStyle]
		} else {
			containerAdjustmentStyle = (state) =>
				state.pressed
					? [{opacity: activeOpacity}, containerStyle]
					: [containerStyle]
		}
	} else {
		throw new Error(`unknown platform ${Platform.OS}`)
	}

	return (
		<Pressable
			android_ripple={{borderless: borderless}}
			style={containerAdjustmentStyle}
			{...passthrough}
		>
			{/* The child <View> is required; the Touchable needs a View as its direct child. */}
			<View style={style}>{children}</View>
		</Pressable>
	)
}

export {CustomPressable as Touchable}
export type {Props as TouchableProps}
