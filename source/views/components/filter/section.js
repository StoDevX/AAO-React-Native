// @flow
import * as React from 'react'
import {ScrollView} from 'react-native'
import type {FilterType} from './types'
import {SingleToggleSection} from './section-toggle'
import {ListSection} from './section-list'
import {PickerSection} from './section-picker'

type FilterSectionPropsType = {
	filter: FilterType,
	onChange: (filter: FilterType) => any,
}

export function FilterSection({filter, onChange}: FilterSectionPropsType) {
	if (filter.type === 'toggle') {
		return <SingleToggleSection filter={filter} onChange={onChange} />
	}

	if (filter.type === 'list') {
		if (!filter.spec.options.length) {
			return null
		}

		return (
			<ScrollView>
				<ListSection filter={filter} onChange={onChange} />
			</ScrollView>
		)
	}

	if (filter.type === 'picker') {
		if (filter.spec.options.length < 2) {
			return null
		}

		return <PickerSection filter={filter} onChange={onChange} />
	}

	return null
}
