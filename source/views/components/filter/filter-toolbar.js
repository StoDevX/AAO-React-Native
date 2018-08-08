// @flow
import * as React from 'react'
import type {FilterType, ListType, ToggleType} from './types'
import {Platform, StyleSheet, ScrollView, View} from 'react-native'
import {Toolbar} from '../toolbar'
import {FilterToolbarButton} from './filter-toolbar-button'
import {ActiveFilterButton} from './active-filter-button'
import concat from 'lodash/concat'

type Props = {
	filters: Array<FilterType>,
	onPopoverDismiss: (filter: FilterType) => any,
}

export function FilterToolbar({filters, onPopoverDismiss}: Props) {

	function updateToggleFilter(filter: ToggleType) {
		let newFilter = filter
		newFilter.enabled = false
		onPopoverDismiss(newFilter)
	}

	function updateListFilter(filter: ListType, option: ListItemSpecType) {
		console.log(filter, option)
		let newFilter = filter
		newFilter.spec.selected = filter.spec.selected.filter(item => (
			item.title !== option.title
		))
		if (newFilter.spec.selected.length === 0) {
			if (filter.spec.mode === 'OR') {
				newFilter.spec.selected = newFilter.spec.options
			}
			newFilter.enabled = false
		}
		console.log(newFilter)
		onPopoverDismiss(newFilter)
	}

	const filterToggles = filters.map((filter, index) => (
		<FilterToolbarButton
			key={filter.spec.title}
			filter={filter}
			iconName={Platform.OS === 'ios' ? 'ios-arrow-down' : 'md-arrow-dropdown'}
			isActive={filter.enabled}
			onPopoverDismiss={onPopoverDismiss}
			style={index === 0 ? styles.first : null}
			title={filter.spec.title}
		/>
	))
	let activeFilterButtons = []
	filters.map(filter => {
		if (filter.enabled) {
			switch (filter.type) {
				case 'toggle':
					activeFilterButtons.push(
						<ActiveFilterButton
							key={filter.spec.title}
							filter={filter}
							label={filter.spec.label}
							onRemove={filter => updateToggleFilter(filter)}
							style={activeFilterButtons.length === 0 ? styles.first : null}
						/>,
					)
					break
				case 'list':
					const newButtons = filter.spec.selected.map((selected, index) => (
						<ActiveFilterButton
							key={selected.title}
							filter={filter}
							label={selected.label || selected.title}
							onRemove={filter => updateListFilter(filter, selected)}
							style={activeFilterButtons.length === 0 && index === 0 ? styles.first : null}
						/>
					))
					activeFilterButtons = concat(activeFilterButtons, newButtons)
					break
				default:
					break
			}
		}
	})

	return (
		<View>
			<ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
				<Toolbar>{filterToggles}</Toolbar>
			</ScrollView>
			<ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
				{activeFilterButtons}
			</ScrollView>
		</View>
	)
}

const styles = StyleSheet.create({
	first: {
		marginLeft: 10,
	},
})
