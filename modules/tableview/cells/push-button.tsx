import * as React from 'react'

import * as c from '@frogpond/colors'
import {Cell} from '@frogpond/tableview'

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
		titleTextColor={showLinkStyle ? c.link : undefined}
	/>
)
