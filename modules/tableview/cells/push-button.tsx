import * as React from 'react'
import {Cell} from '@frogpond/tableview'
import * as c from '@frogpond/colors'

type Props = {
	title: string
	detail?: string | number
	onPress: () => void
	disabled?: boolean
	showLinkStyle?: boolean
	testID?: string
}

export const PushButtonCell = ({
	title,
	detail,
	onPress,
	disabled = false,
	showLinkStyle = false,
	testID,
}: Props): JSX.Element => (
	<Cell
		accessory={showLinkStyle ? undefined : 'DisclosureIndicator'}
		cellStyle={detail ? 'RightDetail' : 'Basic'}
		detail={detail}
		isDisabled={disabled}
		onPress={onPress}
		testID={testID}
		title={title}
		titleTextColor={showLinkStyle ? c.link : undefined}
	/>
)
