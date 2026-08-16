import * as React from 'react'
import type {FilterType} from './types'
import {StyleProp, StyleSheet, Text, TouchableWithoutFeedback, View, ViewStyle} from 'react-native'
import {SymbolView} from 'expo-symbols'
import * as c from '@frogpond/colors'

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
}: Props<T>): React.ReactNode {
	return (
		<TouchableWithoutFeedback onPress={() => onRemove(filter)}>
			<View style={[styles.badge, style]}>
				<Text style={styles.text}>{label}</Text>
				<SymbolView name="xmark.circle.fill" size={20} tintColor={c.label} />
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
