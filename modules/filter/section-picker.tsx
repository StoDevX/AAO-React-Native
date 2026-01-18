import * as React from 'react'
import type {PickerType} from './types'
import {Section} from '@frogpond/tableview'
// import {Host, Picker, Text} from '@expo/ui/swift-ui'
// import {pickerStyle, tag} from '@expo/ui/swift-ui/modifiers'

type Props<T extends object> = {
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
			{/* waiting for beta.10 to work with expo */}
			{/* <Host>
				<Picker
					modifiers={[pickerStyle('inline')]}
					selection={JSON.stringify(selected || options[0])}
					onSelectionChange={(selection) => {
						let pickedItem = spec.options.find(
							(opt) => JSON.stringify(opt) === selection.nativeEvent.selection,
						)
						onChange({...filter, spec: {...spec, selected: pickedItem}})
					}}
				>
					{options.map((val, i) => (
						<Text key={val.label} modifiers={[tag(JSON.stringify(val))]}>
							{val.label}
						</Text>
					))}
				</Picker>
			</Host> */}
		</Section>
	)
}
