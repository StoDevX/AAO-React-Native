import * as React from 'react'
import {Picker, Text} from '@expo/ui/swift-ui'
import {accessibilityIdentifier, pickerStyle, tag} from '@expo/ui/swift-ui/modifiers'

type Props<T extends string> = {
	label: string
	/** Names the picker, for a UI test. */
	id: string
	/** Each choice's value and the name the menu shows for it. */
	options: ReadonlyArray<readonly [T, string]>
	selection: T
	onSelectionChange: (value: T) => void
}

/** A sheet row naming a setting, with its choices in a menu at the trailing edge. */
export function MenuPickerRow<T extends string>({
	label,
	id,
	options,
	selection,
	onSelectionChange,
}: Props<T>): React.ReactNode {
	return (
		<Picker<T>
			label={label}
			modifiers={[pickerStyle('menu'), accessibilityIdentifier(id)]}
			onSelectionChange={onSelectionChange}
			selection={selection}
		>
			{options.map(([value, name]) => (
				<Text key={value} modifiers={[tag(value)]}>
					{name}
				</Text>
			))}
		</Picker>
	)
}
