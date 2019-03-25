// @flow
import * as React from 'react'
import {Switch} from 'react-native'
import {Cell} from 'react-native-tableview-simple'
import {type AppTheme} from '@frogpond/app-theme'
import {withTheme} from '@callstack/react-theme-provider'

type PropsType = {
	label: string,
	value: boolean,
	onChange: (val: boolean) => any,
	theme: AppTheme,
	detail?: string,
	disabled?: boolean,
}

function CellToggle(props: PropsType) {
	let {value, onChange, label, detail, theme, disabled} = props

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

export const RawCellToggle = CellToggle

const ThemedCellToggle = withTheme(CellToggle)

export {ThemedCellToggle as CellToggle}
