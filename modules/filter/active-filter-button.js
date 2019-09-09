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
import {useTheme} from '@frogpond/app-theme'

type Props = {
	filter: FilterType,
	label: string,
	onRemove: (filter: FilterType) => any,
	style?: any,
}

export function ActiveFilterButton({filter, label, onRemove, style}: Props) {
	let theme: AppTheme = useTheme()

	let iconName = Platform.select({
		ios: 'ios-close-circle',
		android: 'md-close-circle',
	})

	let foreground = {color: theme.buttonForeground}
	let background = {backgroundColor: theme.buttonBackground}
	// TODO: pick an appopriate icon color automatically
	let iconColor = white

	return (
		<TouchableWithoutFeedback onPress={() => onRemove(filter)}>
			<View style={[styles.badge, background, style]}>
				<Text style={[styles.text, foreground]}>{label}</Text>
				<Icon color={iconColor} name={iconName} size={20} />
			</View>
		</TouchableWithoutFeedback>
	)
}

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
