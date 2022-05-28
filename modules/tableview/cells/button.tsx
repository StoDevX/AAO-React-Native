import * as React from 'react'
import {StyleProp, StyleSheet, Text, TextStyle} from 'react-native'
import {Cell} from 'react-native-tableview-simple'
import * as c from '@frogpond/colors'

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
	indeterminate?: boolean
	disabled?: boolean
	onPress: () => void
	textStyle?: StyleProp<TextStyle>
	title: string
}): JSX.Element {
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
