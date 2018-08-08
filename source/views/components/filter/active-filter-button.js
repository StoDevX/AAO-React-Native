// @flow
import * as React from 'react'
import type {FilterType, ListItemSpecType} from './types'
import {
	StyleSheet,
	View,
	Text,
	Platform,
	TouchableWithoutFeedback,
} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import * as c from '../colors'

type Props = {
	filter: FilterType,
	label: string,
	onRemove: (filter: FilterType) => any,
	style?: any,
}

export function ActiveFilterButton({filter, label, onRemove, style}: Props) {
	const iconName = Platform.select({
		ios: 'ios-close-circle',
		android: 'md-close-circle',
	})
	return (
		<View style={[style, styles.badge]}>
			<Text style={styles.text}>{label}</Text>
			<TouchableWithoutFeedback
				onPress={() => {
					onRemove(filter)
				}}
			>
				<Icon name={iconName} size={20} color={c.sto.white} />
			</TouchableWithoutFeedback>
		</View>
	)
}

const styles = StyleSheet.create({
	badge: {
		alignItems: 'center',
		backgroundColor: c.accent,
		borderRadius: 15,
		flexDirection: 'row',
		justifyContent: 'center',
		marginRight: 10,
		marginVertical: 10,
		paddingHorizontal: 10,
		paddingVertical: 5,
	},
	text: {
		fontSize: 14,
		paddingRight: 5,
	},
})
