// @flow
import * as React from 'react'
import type {FilterType} from './types'
import {Platform, StyleSheet} from 'react-native'
import {Toolbar} from '../toolbar'
import {FilterToolbarButton} from './filter-toolbar-button'

type Props = {
	filters: Array<FilterType>,
	onPopoverDismiss: (filter: FilterType) => any,
}

export function FilterToolbar({filters, onPopoverDismiss}: Props) {
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

	return <Toolbar>{filterToggles}</Toolbar>
}

const styles = StyleSheet.create({
	first: {
		marginLeft: 10,
	},
})
