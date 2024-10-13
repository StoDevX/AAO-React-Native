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
import Ionicon from '@expo/vector-icons/Ionicons'
import * as c from '../colors'

type IoniconName = keyof typeof Ionicon.glyphMap

interface Props<T extends object> {
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
}: Props<T>): React.JSX.Element {
	let iconName: IoniconName = Platform.select({
		ios: 'close-circle' satisfies IoniconName,
		android: 'close-circle' satisfies IoniconName,
		default: 'close-circle' satisfies IoniconName,
	})

	let iconColor = c.label

	return (
		<TouchableWithoutFeedback
			onPress={() => {
				onRemove(filter)
			}}
		>
			<View style={[styles.badge, style]}>
				<Text style={styles.text}>{label}</Text>
				<Ionicon color={iconColor} name={iconName} size={20} />
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
