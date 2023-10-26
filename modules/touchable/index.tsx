import * as React from 'react'
import {forwardRef, type PropsWithChildren} from 'react'
import {
	Platform,
	Pressable,
	PressableProps,
	PressableStateCallbackType,
	StyleProp,
	View,
	ViewStyle,
} from 'react-native'

import {white} from '@frogpond/colors'

type Props = PropsWithChildren<
	PressableProps & {
		borderless?: boolean
		containerStyle?: StyleProp<ViewStyle>
		style?: StyleProp<ViewStyle>
		highlight?: boolean
		activeOpacity?: number
		underlayColor?: string
	}
>

const CustomPressable = forwardRef<View, Props>((props, ref): JSX.Element => {
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

	let containerAdjustmentStyle:
		| StyleProp<ViewStyle>
		| ((state: PressableStateCallbackType) => StyleProp<ViewStyle>)

	if (Platform.OS === 'android') {
		containerAdjustmentStyle = [containerStyle]
	} else if (Platform.OS === 'ios') {
		if (highlight) {
			containerAdjustmentStyle = (state) =>
				state.pressed
					? [{backgroundColor: underlayColor}, containerStyle]
					: [{backgroundColor: white}, containerStyle]
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
			ref={ref}
			android_ripple={{borderless}}
			style={containerAdjustmentStyle}
			{...passthrough}
		>
			{/* The child <View> is required; the Touchable needs a View as its direct child. */}
			<View style={style}>{children}</View>
		</Pressable>
	)
})

export {CustomPressable as Touchable}
export type {Props as TouchableProps}
