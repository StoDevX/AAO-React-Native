// @flow
import * as React from 'react'
import {StyleSheet, View, Text, Platform, TouchableOpacity} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import * as c from '../../components/colors'

const buttonStyles = StyleSheet.create({
	button: {
		flexDirection: 'row',
		alignItems: 'center',
		marginRight: 8,
		paddingHorizontal: 8,
		paddingVertical: 2,
		marginVertical: 8,
		borderWidth: 1,
		borderRadius: 2,
	},
	activeButton: {
		backgroundColor: c.mandarin,
		borderColor: c.mandarin,
	},
	inactiveButton: {
		borderColor: c.iosDisabledText,
	},
	activeText: {
		color: c.white,
	},
	inactiveText: {
		color: c.iosDisabledText,
	},
	textWithIcon: {
		paddingRight: 8,
	},
})

type ButtonPropsType = {
	iconName?: string,
	title: string,
	isActive: boolean,
	onPress?: () => any,
	style?: any,
}

export function ToolbarButton({
	title,
	iconName,
	isActive,
	onPress,
	style,
}: ButtonPropsType) {
	let icon
	if (!iconName) {
		icon = null
	} else if (Platform.OS === 'ios') {
		icon = isActive ? iconName : iconName + '-outline'
	} else if (Platform.OS === 'android') {
		icon = iconName
	}

	let activeButtonStyle = isActive
		? buttonStyles.activeButton
		: buttonStyles.inactiveButton
	let activeContentStyle = isActive
		? buttonStyles.activeText
		: buttonStyles.inactiveText

	let textWithIconStyle = icon ? buttonStyles.textWithIcon : null
	let activeTextStyle = {
		fontWeight: isActive && Platform.OS === 'android' ? 'bold' : 'normal',
	}

	return (
		<TouchableOpacity
			onPress={onPress}
			style={[buttonStyles.button, activeButtonStyle, style]}
		>
			<Text style={[activeContentStyle, textWithIconStyle, activeTextStyle]}>
				{title}
			</Text>
			{icon ? <Icon name={icon} size={18} style={activeContentStyle} /> : null}
		</TouchableOpacity>
	)
}
