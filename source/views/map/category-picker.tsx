import * as React from 'react'
import {StyleSheet, View} from 'react-native'
import SegmentedControl from '@react-native-segmented-control/segmented-control'
import type {Category} from './types'

export const CATEGORY_LABELS = [
	'Buildings',
	'Outdoors',
	'Parking',
	'Athletics',
] as const

export type CategoryLabel = (typeof CATEGORY_LABELS)[number]

export const LABEL_TO_CATEGORY: Record<CategoryLabel, Category> = {
	Buildings: 'building',
	Outdoors: 'outdoors',
	Parking: 'parking',
	Athletics: 'athletics',
}

type Props = {
	selected: CategoryLabel
	onChange: (label: CategoryLabel) => void
}

export function CategoryPicker({selected, onChange}: Props): React.ReactNode {
	let selectedIndex = CATEGORY_LABELS.indexOf(selected)

	let handleChange = React.useCallback(
		(event: {nativeEvent: {selectedSegmentIndex: number}}) => {
			let label = CATEGORY_LABELS[event.nativeEvent.selectedSegmentIndex]
			if (label) {
				onChange(label)
			}
		},
		[onChange],
	)

	return (
		<View style={styles.container}>
			<SegmentedControl
				onChange={handleChange}
				selectedIndex={selectedIndex}
				values={[...CATEGORY_LABELS]}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {paddingHorizontal: 12, paddingVertical: 8},
})
