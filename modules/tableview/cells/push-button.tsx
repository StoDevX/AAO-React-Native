import * as React from 'react'
import {Cell} from 'react-native-tableview-simple'

type Props = {
	title: string
	detail?: string | number
	onPress: () => void
}

export const PushButtonCell = ({
	title,
	detail,
	onPress,
}: Props): JSX.Element => (
	<Cell
		accessory="DisclosureIndicator"
		cellStyle={detail ? 'RightDetail' : 'Basic'}
		detail={detail}
		onPress={onPress}
		title={title}
	/>
)
