import * as React from 'react'
import {ButtonCell} from '@frogpond/tableview'

type Props = {
	loading: boolean
	disabled?: boolean
	loggedIn: boolean
	onPress: () => void
	label: string
}

export function LoginButton(props: Props): JSX.Element {
	let {loading, disabled, loggedIn, onPress, label} = props

	let message = loading
		? `Logging in to ${label}…`
		: loggedIn
		? `Sign Out of ${label}`
		: `Sign In to ${label}`

	return (
		<ButtonCell
			disabled={loading || disabled}
			indeterminate={loading}
			onPress={onPress}
			title={message}
		/>
	)
}
