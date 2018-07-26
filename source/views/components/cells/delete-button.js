// @flow

import * as React from 'react'
import {StyleSheet, Alert} from 'react-native'
import {Cell} from 'react-native-tableview-simple'
import * as c from '../colors'

const deleteStyles = StyleSheet.create({
	text: {textAlign: 'center', color: c.red},
})

type Props = {
	title: string,
	skipConfirm?: boolean,
	onPress?: () => any,
}

export const DeleteButtonCell = ({
	title,
	skipConfirm = false,
	onPress,
}: Props) => {
	const onPressCallback = onPress ? onPress : () => {}

	const callback = !skipConfirm
		? () =>
				Alert.alert(title, 'Are you sure you want to delete this?', [
					{text: 'Cancel', onPress: () => {}, style: 'cancel'},
					{text: 'Delete', onPress: onPressCallback, style: 'destructive'},
				])
		: onPressCallback

	return (
		<Cell onPress={callback} title={title} titleTextStyle={deleteStyles.text} />
	)
}
