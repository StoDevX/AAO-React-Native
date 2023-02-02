import * as React from 'react'
import type {ToggleFilter} from './types'
import {Section} from '@frogpond/tableview'
import {CellToggle} from '@frogpond/tableview/cells'

type Props<T extends object> = {
	filter: ToggleFilter<T>
	onChange: (filterSpec: ToggleFilter<T>) => void
}

export function SingleToggleSection<T extends object>({
	filter,
	onChange,
}: Props<T>): JSX.Element {
	let {spec, enabled} = filter
	let {title = '', caption, label} = spec
	return (
		<Section footer={caption} header={title.toUpperCase()}>
			<CellToggle
				label={label}
				onChange={(val) => onChange({...filter, enabled: val})}
				value={enabled}
			/>
		</Section>
	)
}
