// @flow

import * as React from 'react'
import {
	TouchableOpacity,
	TouchableHighlight,
	TouchableNativeFeedback,
	Platform,
	View,
} from 'react-native'

type Props = {|
	accessibilityComponentType?: string,
	accessibilityLabel?: string,
	accessibilityTraits?: string,
	activeOpacity?: number,
	borderless?: boolean,
	children?: React.Node,
	containerStyle?: any,
	highlight?: boolean,
	onPress?: () => any,
	style?: any,
	underlayColor?: string,
|}

export const Touchable = ({
	borderless = false,
	children,
	containerStyle,
	highlight = true,
	onPress = () => {},
	style,
	...props
}: Props) => {
	// The child <View> is required; the Touchable needs a View as its direct child.
	const content = <View style={style}>{children}</View>

	switch (Platform.OS) {
		default:
		case 'ios': {
			const Component = highlight ? TouchableHighlight : TouchableOpacity
			const innerProps = highlight
				? {underlayColor: '#d9d9d9'}
				: {activeOpacity: 0.65}

			return (
				<Component
					onPress={onPress}
					{...innerProps}
					style={containerStyle}
					{...props}
				>
					{content}
				</Component>
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
					background={background}
					onPress={onPress}
					style={containerStyle}
					{...props}
				>
					{content}
				</TouchableNativeFeedback>
			)
		}
	}
}
