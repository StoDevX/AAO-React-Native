import * as React from 'react'
import {Platform, StyleSheet} from 'react-native'
import * as c from '../colors'
import type {PickerType} from './types'
import {Section} from '../tableview'
import {Picker} from '@react-native-picker/picker'

interface Props<T extends object> {
	filter: PickerType<T>
	onChange: (filter: PickerType<T>) => void
}

export function PickerSection<T extends object>({
	filter,
	onChange,
}: Props<T>): React.JSX.Element {
	let {spec} = filter
	let {title = '', caption = '', options, selected} = spec

	return (
		<Section footer={caption} header={title.toUpperCase()}>
			<Picker
				itemStyle={styles.pickerItem}
				mode="dropdown"
				onValueChange={(_itemValue, itemIndex) => {
					let pickedItem = spec.options[itemIndex]
					onChange({...filter, spec: {...spec, selected: pickedItem}})
				}}
				selectedValue={JSON.stringify(selected ?? options[0])}
				style={styles.picker}
			>
				{options.map((val, i) => (
					<Picker.Item
						key={i}
						label={val.label}
						style={styles.pickerItem}
						value={JSON.stringify(val)}
					/>
				))}
			</Picker>
		</Section>
	)
}

const styles = StyleSheet.create({
	picker: {
		backgroundColor: c.secondarySystemBackground,
	},
	pickerItem: {
		...Platform.select({
			ios: {
				color: c.label,
			},
		}),
	},
})
