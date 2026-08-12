import * as React from 'react'
import {StyleSheet, View} from 'react-native'
import {Host, Picker, Text} from '@expo/ui/swift-ui'
import {pickerStyle, tag} from '@expo/ui/swift-ui/modifiers'
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
	// The label is its own tag, so the selection the picker reports back is
	// already a CategoryLabel and there is no index to keep in step.
	return (
		<View style={styles.container}>
			<Host matchContents={true}>
				<Picker<CategoryLabel>
					modifiers={[pickerStyle('segmented')]}
					onSelectionChange={onChange}
					selection={selected}
				>
					{CATEGORY_LABELS.map((label) => (
						<Text key={label} modifiers={[tag(label)]}>
							{label}
						</Text>
					))}
				</Picker>
			</Host>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {paddingHorizontal: 12, paddingVertical: 8},
})
