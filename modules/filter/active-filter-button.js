// @flow
import * as React from 'react'
import type {FilterType} from './types'
import {
	StyleSheet,
	View,
	Text,
	Platform,
	TouchableWithoutFeedback,
} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import {white} from '@frogpond/colors'
import {type AppTheme} from '@frogpond/app-theme'
import {withTheme} from '@callstack/react-theme-provider'

type Props = {
	filter: FilterType,
	label: string,
	onRemove: (filter: FilterType) => any,
	style?: any,
	theme: AppTheme,
}

function ActiveFilterButton({filter, label, onRemove, style, theme}: Props) {
	const iconName = Platform.select({
		ios: 'ios-close-circle',
		android: 'md-close-circle',
	})

	const foreground = {color: theme.buttonForeground}
	const background = {backgroundColor: theme.buttonBackground}
	// TODO: pick an appopriate icon color automatically
	const iconColor = white

	return (
		<TouchableWithoutFeedback onPress={() => onRemove(filter)}>
			<View style={[styles.badge, background, style]}>
				<Text style={[styles.text, foreground]}>{label}</Text>
				<Icon color={iconColor} name={iconName} size={20} />
			</View>
		</TouchableWithoutFeedback>
	)
}

export const RawActiveFilterButton = ActiveFilterButton

const ThemedActiveFilterButton = withTheme(ActiveFilterButton)

export {ThemedActiveFilterButton as ActiveFilterButton}

const styles = StyleSheet.create({
	badge: {
		alignItems: 'center',
		borderRadius: 15,
		flexDirection: 'row',
		justifyContent: 'center',
		marginRight: 10,
		paddingHorizontal: 10,
		paddingVertical: 5,
	},
	text: {
		fontSize: 14,
		paddingRight: 5,
	},
})
