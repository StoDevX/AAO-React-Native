import * as React from 'react'
import type {Filter} from './types'
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
import * as c from '@frogpond/colors'

type Props<T extends object> = {
	filter: Filter<T>
	label: string
	onRemove: (filter: Filter<T>) => void
	style?: StyleProp<ViewStyle>
}

export function ActiveFilterButton<T extends object>({
	filter,
	label,
	onRemove,
	style,
}: Props<T>): JSX.Element {
	let iconName = Platform.select({
		ios: 'ios-close-circle',
		android: 'md-close-circle',
		default: '',
	})

	let iconColor = c.label

	return (
		<TouchableWithoutFeedback onPress={() => onRemove(filter)}>
			<View style={[styles.badge, style]}>
				<Text style={styles.text}>{label}</Text>
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
		borderColor: c.separator,
		borderWidth: 1,
		backgroundColor: c.tertiarySystemFill,
	},
	text: {
		fontSize: 14,
		paddingRight: 5,
		color: c.label,
	},
})
