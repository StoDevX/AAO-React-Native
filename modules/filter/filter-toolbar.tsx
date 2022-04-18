import * as React from 'react'
import type {FilterType, ListItemSpecType, ListType, ToggleType} from './types'
import {ScrollView, StyleSheet} from 'react-native'
import {Toolbar} from '@frogpond/toolbar'
import {FilterToolbarButton} from './filter-toolbar-button'
import {ActiveFilterButton} from './active-filter-button'
import flatten from 'lodash/flatten'
import cloneDeep from 'lodash/cloneDeep'

type Props = {
	filters: Array<FilterType>
	onPopoverDismiss: (filter: FilterType) => unknown
}

function updateAnyFilter(callback: (filter: FilterType) => unknown) {
	return (filter: FilterType, option?: ListItemSpecType) => {
		if (filter.type === 'toggle') {
			filter = updateToggleFilter(filter)
		} else if (filter.type === 'list') {
			filter = updateListFilter(filter, option)
		} else if (filter.type === 'picker') {
			// we don't need to do anything for pickers?
		}
		callback(filter)
	}
}

function updateToggleFilter(filter: ToggleType): ToggleType {
	return {...filter, enabled: false}
}

function updateListFilter(
	filter: ListType,
	option?: ListItemSpecType,
): ListType {
	// easier to just clone the filter and mutate than avoid mutations
	let newFilter = cloneDeep(filter)

	// if no option is given, then the "No Terms" button was pressed
	if (option) {
		let optionTitle = option.title
		newFilter.spec.selected = filter.spec.selected.filter(
			(item) => item.title !== optionTitle,
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

export function FilterToolbar({filters, onPopoverDismiss}: Props): JSX.Element {
	let updateFilter = updateAnyFilter(onPopoverDismiss)

	let filterToggles = filters.map((filter) => (
		<FilterToolbarButton
			key={filter.spec.title}
			filter={filter}
			isActive={filter.enabled}
			onPopoverDismiss={onPopoverDismiss}
			title={filter.spec.title}
		/>
	))

	let allButtons = filters
		.filter((f) => f.enabled)
		.map((filter) => {
			if (filter.type === 'toggle') {
				return (
					<ActiveFilterButton
						key={filter.spec.title}
						filter={filter}
						label={filter.spec.label}
						onRemove={(filter) => updateFilter(filter)}
					/>
				)
			} else if (filter.type === 'list') {
				if (!filter.spec.selected.length) {
					return (
						<ActiveFilterButton
							key={filter.spec.title}
							filter={filter}
							label={`No ${filter.spec.title}`}
							onRemove={(filter) => updateFilter(filter)}
						/>
					)
				}

				return filter.spec.selected.map((selected) => (
					<ActiveFilterButton
						key={selected.title}
						filter={filter}
						label={selected.label || selected.title.toString()}
						onRemove={(filter) => updateFilter(filter, selected)}
					/>
				))
			}
			return null
		})
	let activeFilterButtons = flatten(allButtons)
	let anyFiltersEnabled = filters.some((f) => f.enabled)

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
