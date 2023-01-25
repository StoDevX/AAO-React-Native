import * as React from 'react'
import {StyleSheet} from 'react-native'
import * as c from '@frogpond/colors'
import type {PickerType} from './types'
import {Section} from '@frogpond/tableview'
import {Picker} from '@react-native-picker/picker'

type Props<T extends object> = {
	filter: PickerType<T>
	onChange: (filter: PickerType<T>) => void
}

export function PickerSection<T extends object>({
	filter,
	onChange,
}: Props<T>): JSX.Element {
	let {spec} = filter
	let {title = '', caption = '', options, selected} = spec

	return (
		<Section footer={caption} header={title.toUpperCase()}>
			<Picker
				onValueChange={(itemValue, itemIndex) => {
					let pickedItem = spec.options[itemIndex]
					onChange({...filter, spec: {...spec, selected: pickedItem}})
				}}
				selectedValue={JSON.stringify(selected || options[0])}
				style={styles.picker}
			>
				{options.map((val, i) => (
					<Picker.Item key={i} label={val.label} value={JSON.stringify(val)} />
				))}
			</Picker>
		</Section>
	)
}

const styles = StyleSheet.create({
	picker: {
		backgroundColor: c.secondarySystemBackground,
	},
})
