import * as React from 'react'
import {ButtonCell} from '@frogpond/tableview/cells'

type Props = {
	loading: boolean
	disabled?: boolean
	loggedIn: boolean
	onPress: () => void
	label: string
}

export function LoginButton(props: Props): JSX.Element {
	let {loading, disabled, loggedIn, onPress, label} = props
	let innerText = loggedIn ? 'Signing out of' : 'Signing in to'

	let message = loading
		? `${innerText} ${label}…`
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
