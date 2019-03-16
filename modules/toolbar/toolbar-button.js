// @flow
import * as React from 'react'
import {StyleSheet, View, Text, Platform} from 'react-native'
import {Icon, type Glyphs} from '@frogpond/icon'
import * as c from '@frogpond/colors'
import {type AppTheme} from '@frogpond/app-theme'
import {withTheme} from '@callstack/react-theme-provider'

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
	iconName?: Glyphs,
	title: string,
	isActive: boolean,
	theme: AppTheme,
}

function ToolbarButton({title, iconName, isActive, theme}: ButtonPropsType) {
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
	let activeTextStyle = {
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

export const RawToolbarButton = ToolbarButton

const ThemedToolbarButton = withTheme(ToolbarButton)

export {ThemedToolbarButton as ToolbarButton}
