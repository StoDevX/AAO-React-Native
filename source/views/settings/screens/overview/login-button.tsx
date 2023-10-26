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

	let message
	if (loading) {
		message = loggedIn ? `Signing out of ${label}` : `Signing in to ${label}`
	} else {
		message = loggedIn ? `Sign out of ${label}` : `Sign in to ${label}`
	}

	return (
		<ButtonCell
			disabled={loading || disabled}
			indeterminate={loading}
			onPress={onPress}
			title={message}
		/>
	)
}
