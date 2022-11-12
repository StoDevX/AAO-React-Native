import * as React from 'react'
import type {ToggleType} from './types'
import {Section} from '@frogpond/tableview'
import {CellToggle} from '@frogpond/tableview/cells'

type PropsType = {
	filter: ToggleType
	onChange: (filterSpec: ToggleType) => void
}

export function SingleToggleSection({
	filter,
	onChange,
}: PropsType): JSX.Element {
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
