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
}

function CellToggle({value, onChange, label, theme}: PropsType) {
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

export const RawCellToggle = CellToggle

const ThemedCellToggle = withTheme(CellToggle)

export {ThemedCellToggle as CellToggle}
