// @flow
import * as React from 'react'
import {Switch} from 'react-native'
import {Cell} from 'react-native-tableview-simple'
import * as c from '../colors'

type PropsType = {
	label: string,
	value: boolean,
	onChange: (val: boolean) => any,
}

export function CellToggle({value, onChange, label}: PropsType) {
	let toggle = (
		<Switch
			onTintColor={c.switchTintOn}
			onValueChange={onChange}
			value={value}
			tintColor={c.switchTintOff}
		/>
	)
	return <Cell cellAccessoryView={toggle} title={label} />
}
