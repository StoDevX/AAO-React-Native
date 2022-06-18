import * as React from 'react'
import {Cell} from '@frogpond/tableview'
import {infoBlue} from '@frogpond/colors'

type Props = {
	title: string
	detail?: string | number
	onPress: () => void
	disabled?: boolean
	showLinkStyle?: boolean
}

export const PushButtonCell = ({
	title,
	detail,
	onPress,
	disabled = false,
	showLinkStyle = false,
}: Props): JSX.Element => (
	<Cell
		accessory={showLinkStyle ? undefined : 'DisclosureIndicator'}
		cellStyle={detail ? 'RightDetail' : 'Basic'}
		detail={detail}
		isDisabled={disabled}
		onPress={onPress}
		title={title}
		titleTextColor={showLinkStyle ? infoBlue : undefined}
	/>
)
