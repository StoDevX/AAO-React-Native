// @flow

import * as React from 'react'
import {
	TouchableOpacity,
	TouchableHighlight,
	TouchableNativeFeedback,
	Platform,
	View,
} from 'react-native'
import type {ViewStyleProp} from 'react-native/Libraries/StyleSheet/StyleSheet'
import type {Props as TouchableWithoutFeedbackProps} from 'react-native/Libraries/Components/Touchable/TouchableWithoutFeedback'

export type TouchableUnion =
	| typeof TouchableHighlight
	| typeof TouchableOpacity
	| typeof TouchableNativeFeedback

type Props = {|
	borderless?: boolean,
	containerStyle?: ViewStyleProp,
	style?: ViewStyleProp,
	highlight?: boolean,
	activeOpacity?: number,
	underlayColor?: string,
	...$Exact<TouchableWithoutFeedbackProps>,
|}

const Touchable = (props: Props, ref) => {
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
	const content = <View style={style}>{children}</View>

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
			const canBorderless = Platform.Version >= 21
			const background =
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
