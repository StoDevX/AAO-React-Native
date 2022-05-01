import * as React from 'react'
import {StyleSheet, Alert} from 'react-native'
import {Cell} from 'react-native-tableview-simple'
import * as c from '@frogpond/colors'

const deleteStyles = StyleSheet.create({
	text: {textAlign: 'center', color: c.red},
})

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {}

export const DeleteButtonCell = ({
	title,
	skipConfirm = false,
	onPress,
}: {
	title: string
	skipConfirm?: boolean
	onPress?: () => void
}): JSX.Element => {
	let onPressCallback = onPress ?? noop

	let callback = !skipConfirm
		? () =>
				Alert.alert(title, 'Are you sure you want to remove this?', [
					{text: 'Cancel', onPress: noop, style: 'cancel'},
					{text: 'Delete', onPress: onPressCallback, style: 'destructive'},
				])
		: onPressCallback

	return (
		<Cell onPress={callback} title={title} titleTextStyle={deleteStyles.text} />
	)
}
