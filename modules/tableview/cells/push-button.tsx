import * as React from 'react'
import {Cell} from 'react-native-tableview-simple'

type Props = {
	title: string
	detail?: string | number
	onPress: () => void
	disabled?: boolean
}

export const PushButtonCell = ({
	title,
	detail,
	onPress,
	disabled = false,
}: Props): JSX.Element => (
	<Cell
		accessory="DisclosureIndicator"
		cellStyle={detail ? 'RightDetail' : 'Basic'}
		detail={detail}
		isDisabled={disabled}
		onPress={onPress}
		title={title}
	/>
)
