import * as React from 'react'
import type {FilterType} from './types'
import {
	Platform,
	StyleProp,
	StyleSheet,
	Text,
	TouchableWithoutFeedback,
	View,
	ViewStyle,
} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import {useTheme} from '@frogpond/app-theme'

type Props<T extends object> = {
	filter: FilterType<T>
	label: string
	onRemove: (filter: FilterType<T>) => void
	style?: StyleProp<ViewStyle>
}

export function ActiveFilterButton<T extends object>({
	filter,
	label,
	onRemove,
	style,
}: Props<T>): JSX.Element {
	const {colors} = useTheme()

	let iconName = Platform.select({
		ios: 'ios-close-circle',
		android: 'md-close-circle',
		default: '',
	})

	let foreground = {color: colors.text}
	let background = {backgroundColor: colors.primary}
	let iconColor = colors.text

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
