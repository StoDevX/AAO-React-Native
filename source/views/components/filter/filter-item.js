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
	const backgroundColor = active ? c.olevilleGold : c.white

	return (
		<TouchableOpacity
			onPress={onPress}
			style={[{backgroundColor: backgroundColor}, styles.container]}
		>
			<View style={styles.text}>
				<Text>{title}</Text>
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
})
