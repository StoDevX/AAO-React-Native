import * as React from 'react'
import {StyleSheet, View, Text, Platform, TextStyle} from 'react-native'
import {Icon} from '@frogpond/icon'
import type {Glyphs} from '@frogpond/icon'
import * as c from '@frogpond/colors'
import type {AppTheme} from '@frogpond/app-theme'
import {getTheme} from '@frogpond/app-theme'

const buttonStyles = StyleSheet.create({
	button: {
		flexDirection: 'row',
		alignItems: 'center',
		marginRight: 8,
		paddingHorizontal: 8,
		paddingVertical: 0,
		marginVertical: 8,
		borderWidth: 1,
		borderRadius: 2,
	},
	inactiveButton: {
		borderColor: c.iosDisabledText,
	},
	inactiveText: {
		color: c.iosDisabledText,
	},
	textWithIcon: {
		paddingRight: 8,
	},
})

type ButtonPropsType = {
	iconName?: Glyphs
	title: string
	isActive: boolean
}

export function ToolbarButton({
	title,
	iconName,
	isActive,
}: ButtonPropsType): React.ReactElement {
	let theme: AppTheme = getTheme()

	let activeButton = {
		backgroundColor: theme.toolbarButtonBackground,
		borderColor: theme.toolbarButtonBackground,
	}

	let activeText = {
		color: theme.toolbarButtonForeground,
	}

	let activeButtonStyle = isActive ? activeButton : buttonStyles.inactiveButton
	let activeContentStyle = isActive ? activeText : buttonStyles.inactiveText

	let textWithIconStyle = iconName ? buttonStyles.textWithIcon : null
	let activeTextStyle: TextStyle = {
		fontWeight: isActive && Platform.OS === 'android' ? 'bold' : 'normal',
	}

	return (
		<View style={[buttonStyles.button, activeButtonStyle]}>
			<Text style={[activeContentStyle, textWithIconStyle, activeTextStyle]}>
				{title}
			</Text>
			{iconName ? (
				<Icon name={iconName} size={18} style={activeContentStyle} />
			) : null}
		</View>
	)
}
