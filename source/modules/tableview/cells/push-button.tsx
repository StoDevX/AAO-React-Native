import * as React from 'react'
import {Cell} from '../../tableview'
import * as c from '../../colors'

interface Props {
	title: string
	detail?: string
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
}: Props): React.JSX.Element => (
	<Cell
		accessory={showLinkStyle ? undefined : 'DisclosureIndicator'}
		cellStyle={detail != null ? 'RightDetail' : 'Basic'}
		detail={detail}
		isDisabled={disabled}
		onPress={onPress}
		title={title}
		titleTextColor={showLinkStyle ? c.link : undefined}
	/>
)
