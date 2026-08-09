import * as React from 'react'
import {StyleSheet, Switch, View} from 'react-native'
import {Cell} from '@frogpond/tableview'
import {useTheme} from '@frogpond/app-theme'

type PropsType = {
	label: string
	value: boolean
	onChange: (val: boolean) => void
	detail?: string
	disabled?: boolean
}

export function CellToggle(props: PropsType): React.ReactNode {
	let {colors} = useTheme()

	let {value, onChange, label, detail, disabled} = props

	let toggle = (
		<View style={styles.toggleContainer}>
			<Switch
				disabled={disabled}
				onValueChange={onChange}
				trackColor={{
					true: colors.primary,
					false: undefined,
				}}
				value={value}
			/>
		</View>
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

const styles = StyleSheet.create({
	toggleContainer: {
		justifyContent: 'center',
	},
})
