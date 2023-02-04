import React, {useCallback} from 'react'

import type {Filter} from './types'
import {ScrollView, StyleSheet} from 'react-native'
import {Toolbar} from '@frogpond/toolbar'
import {FilterToolbarButton} from './filter-toolbar-button'
import {isFilterEnabled} from './tools'
import produce, {castDraft} from 'immer'

type Props<T> = {
	filters: Filter<T>[]
	onChange: (filters: Filter<T>[]) => void
}

export function FilterToolbar<T>({filters, onChange}: Props<T>): JSX.Element {
	let handleChange = useCallback(
		(updatedFilter: Filter<T>) => {
			onChange(
				produce(filters, (filters) => {
					let index = filters.findIndex(
						(filter) => filter.title === updatedFilter.title,
					)
					if (index !== -1) {
						filters[index] = castDraft(updatedFilter)
					}
				}),
			)
		},
		[filters, onChange],
	)

	return (
		<Toolbar>
			<ScrollView
				contentContainerStyle={styles.scroller}
				horizontal={true}
				showsHorizontalScrollIndicator={false}
			>
				{filters.map((filter) => (
					<FilterToolbarButton<T>
						key={filter.title}
						filter={filter}
						isActive={isFilterEnabled(filter)}
						onChange={handleChange}
						title={filter.title}
					/>
				))}
			</ScrollView>
		</Toolbar>
	)
}

const styles = StyleSheet.create({
	scroller: {
		paddingLeft: 10,
		paddingVertical: 8,
	},
})
