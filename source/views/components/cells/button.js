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

type Props = {
	indeterminate?: boolean,
	disabled?: boolean,
	onPress: () => any,
	title: string,
}

export function ButtonCell({indeterminate, disabled, onPress, title}: Props) {
	let isDisabled = indeterminate || disabled
	return (
		<Cell
			isDisabled={isDisabled}
			onPress={onPress}
			title={
				<Text style={[isDisabled ? styles.disabled : styles.active]}>
					{title}
				</Text>
			}
			titleTextStyle={styles.title}
		/>
	)
}
