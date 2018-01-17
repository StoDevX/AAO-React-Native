// @flow

import * as React from 'react'
import {StyleSheet, Text} from 'react-native'
import {Cell} from 'react-native-tableview-simple'
import * as c from '../../components/colors'

const styles = StyleSheet.create({
	title: {
		textAlign: 'left',
	},
	active: {
		color: c.infoBlue,
	},
	disabled: {
		color: c.iosDisabledText,
	},
})

export function ButtonCell({
	indeterminate,
	disabled,
	onPress,
	title,
}: {
	indeterminate?: boolean,
	disabled?: boolean,
	onPress: () => any,
	title: string,
}) {
	return (
		<Cell
			isDisabled={indeterminate || disabled}
			onPress={onPress}
			title={
				<Text
					style={[indeterminate || disabled ? styles.disabled : styles.active]}
				>
					{title}
				</Text>
			}
			titleTextStyle={styles.title}
		/>
	)
}
