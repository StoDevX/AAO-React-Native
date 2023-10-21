import * as React from 'react'

import {Section} from '@frogpond/tableview'
import {CellToggle} from '@frogpond/tableview/cells'

import type {ToggleType} from './types'

type Props<T extends object> = {
	filter: ToggleType<T>
	onChange: (filterSpec: ToggleType<T>) => void
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
