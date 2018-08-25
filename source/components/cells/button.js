// @flow

import * as React from 'react'
import {StyleSheet, Text} from 'react-native'
import {Cell} from 'react-native-tableview-simple'
import * as c from '../colors'

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
	textStyle,
	title,
}: {
	indeterminate?: boolean,
	disabled?: boolean,
	onPress: () => any,
	textStyle?: any,
	title: string,
}) {
	return (
		<Cell
			isDisabled={indeterminate || disabled}
			onPress={onPress}
			title={
				<Text
					style={[
						indeterminate || disabled ? styles.disabled : styles.active,
						textStyle,
					]}
				>
					{title}
				</Text>
			}
			titleTextStyle={styles.title}
		/>
	)
}
