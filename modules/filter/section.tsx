import * as React from 'react'
import {ScrollView} from 'react-native'
import type {FilterType} from './types'
import {SingleToggleSection} from './section-toggle'
import {ListSection} from './section-list'
import {PickerSection} from './section-picker'

type Props<T extends object> = {
	filter: FilterType<T>
	onChange: (filter: FilterType<T>) => unknown
}

export function FilterSection<T extends object>({
	filter,
	onChange,
}: Props<T>): React.ReactNode {
	if (filter.type === 'toggle') {
		return <SingleToggleSection<T> filter={filter} onChange={onChange} />
	}

	if (filter.type === 'list') {
		if (!filter.spec.options.length) {
			return null
		}

		return (
			<ScrollView contentInsetAdjustmentBehavior="automatic">
				<ListSection<T> filter={filter} onChange={onChange} />
			</ScrollView>
		)
	}

	if (filter.type === 'picker') {
		if (filter.spec.options.length < 2) {
			return null
		}

		return <PickerSection<T> filter={filter} onChange={onChange} />
	}

	return null
}
