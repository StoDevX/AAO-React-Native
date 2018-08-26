// @flow
import * as React from 'react'
import {Switch} from 'react-native'
import {Cell} from 'react-native-tableview-simple'
import * as theme from '@app/lib/theme'

type PropsType = {
	label: string,
	value: boolean,
	onChange: (val: boolean) => any,
}

export function CellToggle({value, onChange, label}: PropsType) {
	let toggle = (
		<Switch
			onTintColor={theme.switchTintOn}
			onValueChange={onChange}
			tintColor={theme.switchTintOff}
			value={value}
		/>
	)
	return <Cell cellAccessoryView={toggle} title={label} />
}
