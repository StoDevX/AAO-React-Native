// @flow

import * as React from 'react'
import {
	TouchableOpacity,
	TouchableHighlight,
	TouchableNativeFeedback,
	Platform,
	View,
} from 'react-native'

export type TouchableUnion =
	| typeof TouchableHighlight
	| typeof TouchableOpacity
	| typeof TouchableNativeFeedback

type Props = {|
	accessible?: boolean,
	accessibilityComponentType?: string,
	accessibilityLabel?: string,
	accessibilityTraits?: string,
	activeOpacity?: number,
	borderless?: boolean,
	children?: React.Node,
	containerStyle?: any,
	getRef?: () => TouchableUnion,
	highlight?: boolean,
	onPress?: () => any,
	style?: any,
	testID?: string,
	underlayColor?: string,
|}

export const Touchable = ({
	borderless = false,
	children,
	containerStyle,
	getRef,
	highlight = true,
	onPress = () => {},
	accessible = true,
	accessibilityLabel,
	style,
	testID,
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
					ref={getRef}
					accessibilityLabel={accessibilityLabel}
					accessible={accessible}
					onPress={onPress}
					{...innerProps}
					style={containerStyle}
					testID={testID}
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
					ref={getRef}
					accessibilityLabel={accessibilityLabel}
					accessible={accessible}
					background={background}
					onPress={onPress}
					style={containerStyle}
					testID={testID}
					{...props}
				>
					{content}
				</TouchableNativeFeedback>
			)
		}
	}
}
