// @flow
import * as React from 'react'
import {Switch} from 'react-native'
import {Cell} from 'react-native-tableview-simple'
import {useTheme} from '@frogpond/theme'

type PropsType = {
	label: string,
	value: boolean,
	onChange: (val: boolean) => any,
	detail?: string,
	disabled?: boolean,
}

export function CellToggle(props: PropsType) {
	let {value, onChange, label, detail, disabled} = props
	let theme = useTheme()

	let toggle = (
		<Switch
			disabled={disabled}
			onValueChange={onChange}
			trackColor={{true: theme.switchTintOn, false: theme.switchTintOff}}
			value={value}
		/>
	)

	return (
		<Cell
			cellAccessoryView={toggle}
			cellStyle={detail ? 'Subtitle' : 'Basic'}
			detail={detail}
			title={label}
		/>
	)
}
