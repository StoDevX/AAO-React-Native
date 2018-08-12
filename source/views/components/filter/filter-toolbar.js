// @flow
import * as React from 'react'
import type {FilterType, ListType, ToggleType, ListItemSpecType} from './types'
import {StyleSheet, ScrollView} from 'react-native'
import {Toolbar} from '../toolbar'
import {FilterToolbarButton} from './filter-toolbar-button'
import {ActiveFilterButton} from './active-filter-button'
import flatten from 'lodash/flatten'

type Props = {
	filters: Array<FilterType>,
	onPopoverDismiss: (filter: FilterType) => any,
}

export function FilterToolbar({filters, onPopoverDismiss}: Props) {
	function updateFilter(filter: FilterType, option?: ListItemSpecType) {
		if (filter.type === 'toggle') {
			updateToggleFilter(filter)
		} else if (filter.type === 'list' && option) {
			updateListFilter(filter, option)
		}
	}

	function updateToggleFilter(filter: ToggleType) {
		let newFilter = filter
		newFilter.enabled = false
		onPopoverDismiss(newFilter)
	}

	function updateListFilter(filter: ListType, option: ListItemSpecType) {
		let newFilter = filter
		newFilter.spec.selected = filter.spec.selected.filter(
			item => item.title !== option.title,
		)
		if (newFilter.spec.selected.length === 0) {
			if (filter.spec.mode === 'OR') {
				newFilter.spec.selected = newFilter.spec.options
			}
			newFilter.enabled = false
		}
		onPopoverDismiss(newFilter)
	}

	const filterToggles = filters.map(filter => (
		<FilterToolbarButton
			key={filter.spec.title}
			filter={filter}
			isActive={filter.enabled}
			onPopoverDismiss={onPopoverDismiss}
			title={filter.spec.title}
		/>
	))

	const allButtons = filters.filter(f => f.enabled).map(filter => {
		if (filter.type === 'toggle') {
			return (
				<ActiveFilterButton
					key={filter.spec.title}
					filter={filter}
					label={filter.spec.label}
					onRemove={filter => updateFilter(filter)}
				/>
			)
		} else if (filter.type === 'list') {
			return filter.spec.selected.map(selected => (
				<ActiveFilterButton
					key={selected.title}
					filter={filter}
					label={selected.label || selected.title.toString()}
					onRemove={filter => updateFilter(filter, selected)}
				/>
			))
		}
		return null
	})
	const activeFilterButtons = flatten(allButtons)
	const anyFiltersEnabled = filters.some(f => f.enabled)

	return (
		<React.Fragment>
			<Toolbar>
				<ScrollView
					contentContainerStyle={styles.scroller}
					horizontal={true}
					showsHorizontalScrollIndicator={false}
				>
					{filterToggles}
				</ScrollView>
			</Toolbar>
			{anyFiltersEnabled && (
				<ScrollView
					contentContainerStyle={styles.scroller}
					horizontal={true}
					showsHorizontalScrollIndicator={false}
				>
					{activeFilterButtons}
				</ScrollView>
			)}
		</React.Fragment>
	)
}

const styles = StyleSheet.create({
	scroller: {
		paddingLeft: 10,
		paddingVertical: 8,
	},
})
