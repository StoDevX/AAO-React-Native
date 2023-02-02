import * as React from 'react'
import {ScrollView} from 'react-native'
import type {Filter} from './types'
import {SingleToggleSection} from './section-toggle'
import {ListSection} from './section-list'
import {PickerSection} from './section-picker'

type Props<T extends object> = {
	filter: Filter<T>
	onChange: (filter: Filter<T>) => unknown
}

export function FilterSection<T extends object>({
	filter,
	onChange,
}: Props<T>): JSX.Element | null {
	if (filter.type === 'toggle') {
		return <SingleToggleSection<T> filter={filter} onChange={onChange} />
	}

	if (filter.type === 'list') {
		if (!filter.config.options.length) {
			return null
		}

		return (
			<ScrollView>
				<ListSection<T> filter={filter} onChange={onChange} />
			</ScrollView>
		)
	}

	if (filter.type === 'picker') {
		if (filter.config.options.length < 2) {
			return null
		}

		return <PickerSection<T> filter={filter} onChange={onChange} />
	}

	return null
}
