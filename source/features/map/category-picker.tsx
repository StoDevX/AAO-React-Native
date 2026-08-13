import * as React from 'react'
import {Picker, Text} from '@expo/ui/swift-ui'
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
	// No `Host` of its own: this renders inside the picker sheet's single Host,
	// and a nested Host would hand the segments back to React Native's layout --
	// which is what the sheet was rebuilt in SwiftUI to get away from.
	return (
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
	)
}
