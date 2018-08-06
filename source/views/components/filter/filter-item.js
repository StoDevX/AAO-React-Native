// @flow

import * as React from 'react'
import * as c from '../colors'
import {TouchableOpacity, Text, StyleSheet, View} from 'react-native'

type Props = {
	active: boolean,
	onPress: () => any,
	title: string | number,
}

export const FilterItem = ({active, onPress, title}: Props) => {
	let activeButtonStyle = active
		? styles.activeButton
		: styles.inactiveButton
	let activeContentStyle = active
		? styles.activeText
		: styles.inactiveText

	return (
		<TouchableOpacity
			onPress={onPress}
			style={[activeButtonStyle, styles.container]}
		>
			<View style={styles.text}>
				<Text style={activeContentStyle}>{title}</Text>
			</View>
		</TouchableOpacity>
	)
}

const styles = StyleSheet.create({
	container: {
		padding: 3,
		marginRight: 3,
		marginBottom: 3,
		borderRadius: 3,
		borderColor: c.iosGray,
		borderWidth: 1,
	},
	text: {
		alignItems: 'flex-start',
	},
	activeButton: {
		backgroundColor: c.toolbarButtonBackground,
		borderColor: c.toolbarButtonBackground,
	},
	inactiveButton: {
		borderColor: c.iosDisabledText,
	},
	activeText: {
		color: c.toolbarButtonForeground,
	},
	inactiveText: {
		color: c.iosDisabledText,
	},
})
