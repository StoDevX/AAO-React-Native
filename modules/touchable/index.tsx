import * as React from 'react'
import {
	TouchableOpacity,
	TouchableHighlight,
	TouchableNativeFeedback,
	Platform,
	View,
} from 'react-native'
import type {ViewStyle} from 'react-native'
import type {TouchableWithoutFeedbackProps} from 'react-native'

export type TouchableUnion =
	| typeof TouchableHighlight
	| typeof TouchableOpacity
	| typeof TouchableNativeFeedback

type Props = TouchableWithoutFeedbackProps & {
	borderless?: boolean
	containerStyle?: ViewStyle
	children?: [View]
	style?: ViewStyle
	highlight?: boolean
	activeOpacity?: number
	underlayColor?: string
}

const Touchable = (props: Props, ref: any) => {
	let {
		borderless = false,
		children,
		containerStyle,
		highlight = true,
		style,
		underlayColor = '#d9d9d9',
		activeOpacity = 0.65,
		...passthrough
	} = props

	// The child <View> is required; the Touchable needs a View as its direct child.
	let content = <View style={style}>{children}</View>

	switch (Platform.OS) {
		default:
		case 'ios': {
			if (highlight) {
				return (
					<TouchableHighlight
						ref={ref}
						style={containerStyle}
						underlayColor={underlayColor}
						{...passthrough}
					>
						{content}
					</TouchableHighlight>
				)
			}

			return (
				<TouchableOpacity
					ref={ref}
					activeOpacity={activeOpacity}
					style={containerStyle}
					{...passthrough}
				>
					{content}
				</TouchableOpacity>
			)
		}

		case 'android': {
			let canBorderless = Platform.Version >= 21
			let background =
				borderless && canBorderless
					? TouchableNativeFeedback.SelectableBackgroundBorderless()
					: TouchableNativeFeedback.SelectableBackground()

			return (
				<TouchableNativeFeedback
					ref={ref}
					background={background}
					style={containerStyle}
					{...passthrough}
				>
					{content}
				</TouchableNativeFeedback>
			)
		}
	}
}

// $FlowExpectedError Cannot call React.forwardRef because property forwardRef is missing in module react
const WrappedTouchable = React.forwardRef(Touchable)

export {WrappedTouchable as Touchable}
