// @flow
import * as React from 'react'
import type {FilterType, ListType, ToggleType, ListItemSpecType} from './types'
import {StyleSheet, ScrollView} from 'react-native'
import {Toolbar} from '../toolbar'
import {FilterToolbarButton} from './filter-toolbar-button'
import {ActiveFilterButton} from './active-filter-button'
import flatten from 'lodash/flatten'
import cloneDeep from 'lodash/cloneDeep'

type Props = {
	filters: Array<FilterType>,
	onPopoverDismiss: (filter: FilterType) => any,
}

function updateAnyFilter(callback: FilterType => any) {
	return (filter: FilterType, option?: ListItemSpecType) => {
		if (filter.type === 'toggle') {
			filter = updateToggleFilter(filter)
		} else if (filter.type === 'list') {
			filter = updateListFilter(filter, option)
		}
		callback(filter)
	}
}

function updateToggleFilter(filter: ToggleType) {
	let newFilter: ToggleType = {...filter, enabled: false}
	return newFilter
}

function updateListFilter(filter: ListType, option?: ListItemSpecType) {
	// easier to just clone the filter and mutate than avoid mutations
	let newFilter = cloneDeep(filter)

	// if no option is given, then the "No Terms" button was pressed
	if (option) {
		let optionTitle = option.title
		newFilter.spec.selected = filter.spec.selected.filter(
			item => item.title !== optionTitle,
		)
	}

	if (newFilter.spec.selected.length === 0) {
		if (filter.spec.mode === 'OR') {
			newFilter.spec.selected = newFilter.spec.options
		}
		newFilter.enabled = false
	}

	return newFilter
}

export function FilterToolbar({filters, onPopoverDismiss}: Props) {
	let updateFilter = updateAnyFilter(onPopoverDismiss)

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
			if (!filter.spec.selected.length) {
				return (
					<ActiveFilterButton
						key={filter.spec.title}
						filter={filter}
						label={`No ${filter.spec.title}`}
						onRemove={filter => updateFilter(filter)}
					/>
				)
			}

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
				<Toolbar>
					<ScrollView
						contentContainerStyle={styles.scroller}
						horizontal={true}
						showsHorizontalScrollIndicator={false}
					>
						{activeFilterButtons}
					</ScrollView>
				</Toolbar>
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
