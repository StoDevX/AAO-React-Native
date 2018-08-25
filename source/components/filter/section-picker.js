// @flow
import * as React from 'react'
import {Picker, StyleSheet} from 'react-native'
import * as c from '../colors'
import type {PickerType} from './types'
import {Section} from 'react-native-tableview-simple'

type PropsType = {
	filter: PickerType,
	onChange: (filter: PickerType) => any,
}

export function PickerSection({filter, onChange}: PropsType) {
	const {spec} = filter
	const {title = '', caption = '', options, selected} = spec

	function pickerPicked(pickedValue: string, pickedItemIndex: number) {
		let pickedItem = spec.options[pickedItemIndex]

		onChange({
			...filter,
			spec: {
				...spec,
				selected: pickedItem,
			},
		})
	}

	return (
		<Section footer={caption} header={title.toUpperCase()}>
			<Picker
				onValueChange={pickerPicked}
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
		backgroundColor: c.white,
	},
})
