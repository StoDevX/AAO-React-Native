import * as React from 'react'
import {Alert, StyleSheet} from 'react-native'

import * as c from '@frogpond/colors'
import {Cell} from '@frogpond/tableview'

import noop from 'lodash/noop'

const deleteStyles = StyleSheet.create({
	text: {textAlign: 'center', color: c.red},
})

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
