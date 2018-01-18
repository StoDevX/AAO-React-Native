// @flow

import * as React from 'react'
import {ButtonCell} from '../../components/cells/button'

export function LoginButton({
	loading,
	disabled,
	loggedIn,
	onPress,
	label,
}: {
	loading: boolean,
	disabled?: boolean,
	loggedIn: boolean,
	onPress: () => any,
	label: string,
}) {
	return (
		<ButtonCell
			disabled={loading || disabled}
			indeterminate={loading}
			onPress={onPress}
			title={
				loading
					? `Logging in to ${label}…`
					: loggedIn ? `Sign Out of ${label}` : `Sign In to ${label}`
			}
		/>
	)
}
