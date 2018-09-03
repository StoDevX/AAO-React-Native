// @flow
import * as React from 'react'
import {Cell} from 'react-native-tableview-simple'

type Args = {
	title: string,
	detail?: string | number,
	onPress: () => any,
}

export const PushButtonCell = ({title, detail, onPress}: Args) => (
	<Cell
		accessory="DisclosureIndicator"
		cellStyle={detail ? 'RightDetail' : 'Basic'}
		detail={detail}
		onPress={onPress}
		title={title}
	/>
)
