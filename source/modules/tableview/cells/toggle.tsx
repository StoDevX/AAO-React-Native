import * as React from 'react'
import {Platform, Switch} from 'react-native'
import {Cell} from '../index'
import {useTheme} from '../../app-theme'

interface PropsType {
	label: string
	value: boolean
	onChange: (val: boolean) => void
	detail?: string
	disabled?: boolean
}

export function CellToggle(props: PropsType): React.JSX.Element {
	let {colors} = useTheme()

	let {value, onChange, label, detail, disabled} = props

	let toggle = (
		<Switch
			disabled={disabled}
			onValueChange={onChange}
			trackColor={{
				true: Platform.select({ios: colors.primary, android: undefined}),
				false: undefined,
			}}
			value={value}
		/>
	)

	return (
		<Cell
			cellAccessoryView={toggle}
			cellStyle={detail != null ? 'Subtitle' : 'Basic'}
			detail={detail}
			title={label}
		/>
	)
}
